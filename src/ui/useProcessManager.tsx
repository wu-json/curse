import { createContext, useContext, useMemo, useState } from "react";
import { spawn, type Subprocess } from "bun";
import { parse as parseShellCommand } from "shell-quote";
import { LogBuffer, readStreamToBuffer } from "./logBuffer";

import type { MarionetteConfig } from "../parser";
import { ENV } from "../env";

export enum ProcessStatus {
	Error = "error",
	Pending = "pending",
	Running = "running",
	Starting = "starting",
	Success = "success",
	Killing = "killing",
	Killed = "killed",
}

export enum HealthStatus {
	None = "none",
	Ready = "ready",
	NotReady = "not_ready",
}

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	healthStatus: HealthStatus;
	proc?: Subprocess;
	startedAt?: Date;
	logBuffer: LogBuffer;
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

	const parsedCommand = parseShellCommand(process.command);
	const cmd = parsedCommand.map((entry) => {
		if (typeof entry !== "string") {
			throw new Error(
				`Unsupported shell command entry: ${JSON.stringify(entry)}`,
			);
		}
		return entry;
	});

	const proc = spawn({
		cmd,
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
			healthStatus: HealthStatus.None,
			logBuffer: new LogBuffer(ENV.LOG_BUFFER_SIZE ?? 5_000),
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
