import { createContext, useContext, useMemo, useState } from "react";
import { spawn, type Subprocess } from "bun";

import type { MarionetteConfig } from "./parser";
import { ENV } from "./env";

class CircularBuffer {
	private buffer: string[];
	private head = 0;
	private size = 0;
	private readonly capacity: number;

	constructor(capacity: number) {
		this.capacity = capacity;
		this.buffer = new Array(capacity);
	}

	add(line: string): void {
		this.buffer[this.head] = line;
		this.head = (this.head + 1) % this.capacity;
		if (this.size < this.capacity) {
			this.size++;
		}
	}

	getLines(): string[] {
		if (this.size === 0) return [];

		if (this.size < this.capacity) {
			return this.buffer.slice(0, this.size);
		}

		return [
			...this.buffer.slice(this.head),
			...this.buffer.slice(0, this.head),
		];
	}

	clear(): void {
		this.head = 0;
		this.size = 0;
	}
}

async function readStreamToBuffer(
	stream: ReadableStream<Uint8Array> | null,
	logBuffer: CircularBuffer,
): Promise<void> {
	if (!stream) return;

	const decoder = new TextDecoder();
	const reader = stream.getReader();

	try {
		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim()) {
					logBuffer.add(line);
				}
			}
		}
		if (buffer.trim()) {
			logBuffer.add(buffer);
		}
	} catch (error) {
		logBuffer.add(`Error reading output: ${error}`);
	}
}

export enum ProcessStatus {
	Error = "error",
	Pending = "pending",
	Running = "running",
	Starting = "starting",
	Success = "success",
	Killing = "killing",
	Killed = "killed",
}

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	proc?: Subprocess;
	startedAt?: Date;
	logBuffer: CircularBuffer;
};

type UpdateProcessFields = {
	proc?: Subprocess;
	status?: ProcessStatus;
	startedAt?: Date;
};

async function execProcess({
	process,
	updateProcess,
}: {
	process: Process;
	updateProcess: (updates: UpdateProcessFields) => void;
}): Promise<void> {
	updateProcess({
		status: ProcessStatus.Starting,
		startedAt: new Date(),
	});

	process.logBuffer.clear();

	const proc = spawn({
		cmd: [ENV.SHELL, "-c", process.command],
		stdout: "pipe",
		stderr: "pipe",
	});
	updateProcess({ status: ProcessStatus.Running, proc });

	readStreamToBuffer(proc.stdout, process.logBuffer);
	readStreamToBuffer(proc.stderr, process.logBuffer);

	const result = await proc.exited;
	updateProcess({
		status: result === 0 ? ProcessStatus.Success : ProcessStatus.Error,
	});
}

type ProcessManagerCtx = {
	processes: Process[];
	selectedProcess: Process | null;
	selectedProcessIdx: number;
	setProcesses: React.Dispatch<React.SetStateAction<Process[]>>;
	setSelectedProcessIdx: React.Dispatch<React.SetStateAction<number>>;
	runPendingProcesses: () => void;
	restartSelectedProcess: () => Promise<void>;
	killSelectedProcess: () => Promise<void>;
	killAllProcesses: () => Promise<void>;
};

const ProcessManagerCtx = createContext<ProcessManagerCtx>({
	processes: [],
	selectedProcess: null,
	selectedProcessIdx: 0,
	setProcesses: () => {},
	setSelectedProcessIdx: () => {},
	runPendingProcesses: () => {},
	restartSelectedProcess: async () => {},
	killSelectedProcess: async () => {},
	killAllProcesses: async () => {},
});

export function ProcessManagerProvider(props: {
	config: MarionetteConfig;
	children: React.ReactNode;
}) {
	const [selectedProcessIdx, setSelectedProcessIdx] = useState(0);
	const [processes, setProcesses] = useState<Process[]>(
		props.config.process.map((p) => ({
			name: p.name,
			command: p.command,
			status: ProcessStatus.Pending,
			logBuffer: new CircularBuffer(500),
		})),
	);

	const selectedProcess = useMemo(() => {
		if (processes.length === 0) {
			return null;
		}
		return processes[selectedProcessIdx] ?? null;
	}, [processes, selectedProcessIdx]);

	const updateProcess = (processIdx: number, fields: UpdateProcessFields) => {
		setProcesses((prev) =>
			prev.map((process, i) =>
				i === processIdx ? { ...process, ...fields } : process,
			),
		);
	};

	const runPendingProcesses = () => {
		processes.map((p, i) => {
			if (p.status === ProcessStatus.Pending) {
				execProcess({
					process: p,
					updateProcess: (fields: UpdateProcessFields) =>
						updateProcess(i, fields),
				});
			}
		});
	};

	const restartSelectedProcess = async () => {
		const process = processes[selectedProcessIdx];
		if (!process) {
			return;
		}
		if (process.status === ProcessStatus.Running) {
			await killProcess(selectedProcessIdx);
		}
		await execProcess({
			process: process,
			updateProcess: (fields: UpdateProcessFields) =>
				updateProcess(selectedProcessIdx, fields),
		});
	};

	const killProcess = async (processIdx: number) => {
		if (!processes[processIdx]) {
			return;
		}
		const { proc, status } = processes[processIdx];
		if (!proc || status !== ProcessStatus.Running) {
			return;
		}
		updateProcess(processIdx, { status: ProcessStatus.Killing });

		proc.kill("SIGTERM");
		const timeout = setTimeout(() => {
			if (!proc.killed) {
				proc.kill("SIGKILL");
			}
		}, 5000);

		await proc.exited;
		clearTimeout(timeout);
		updateProcess(processIdx, { status: ProcessStatus.Killed });
	};

	const killSelectedProcess = async () => {
		await killProcess(selectedProcessIdx);
	};

	const killAllProcesses = async () => {
		await Promise.all(processes.map(async (_, i) => killProcess(i)));
	};

	return (
		<ProcessManagerCtx.Provider
			value={{
				processes,
				selectedProcess,
				selectedProcessIdx,
				setProcesses,
				setSelectedProcessIdx,
				runPendingProcesses,
				restartSelectedProcess,
				killSelectedProcess,
				killAllProcesses,
			}}
		>
			{props.children}
		</ProcessManagerCtx.Provider>
	);
}

export function useProcessManager() {
	return useContext(ProcessManagerCtx);
}
