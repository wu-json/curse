import { createContext, useContext, useMemo, useState } from "react";
import { spawn, type Subprocess } from "bun";
import MiniSearch from "minisearch";

import type { MarionetteConfig } from "../parser";
import { ENV } from "../env";

class LogBuffer {
	private lines: string[] = [];
	private readonly maxSize: number;
	private totalLinesAdded = 0;
	private searchIndex: MiniSearch<{
		id: number;
		text: string;
		lineNumber: number;
	}>;
	private nextId = 0;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
		this.searchIndex = new MiniSearch({
			fields: ["text"],
			storeFields: ["text", "lineNumber"],
			idField: "id",
		});
	}

	add(line: string): void {
		this.lines.push(line);
		this.totalLinesAdded++;

		// Add to search index
		const doc = {
			id: this.nextId++,
			text: line,
			lineNumber: this.totalLinesAdded - 1,
		};
		this.searchIndex.add(doc);

		if (this.lines.length > this.maxSize) {
			this.lines.shift();
			// Remove oldest entry from search index
			const oldestLineNumber = this.getOldestAvailableLineNumber();
			const docsToRemove = this.searchIndex.search("*", {
				filter: (result) => result.lineNumber < oldestLineNumber,
			});
			for (const doc of docsToRemove) {
				this.searchIndex.discard(doc.id);
			}
		}
	}

	getLines(): string[] {
		return [...this.lines];
	}

	getRecentLines(count: number): string[] {
		if (count <= 0 || this.lines.length === 0) return [];

		const startIndex = Math.max(0, this.lines.length - count);
		return this.lines.slice(startIndex);
	}

	getLinesFromEnd(offset: number, count: number): string[] {
		if (count <= 0 || this.lines.length === 0 || offset >= this.lines.length)
			return [];

		const endIndex = this.lines.length - offset;
		const startIndex = Math.max(0, endIndex - count);

		return this.lines.slice(startIndex, endIndex);
	}

	getLinesByAbsolutePosition(
		absoluteStartLine: number,
		count: number,
	): string[] {
		if (count <= 0 || this.lines.length === 0) return [];

		const oldestLine = this.getOldestAvailableLineNumber();
		const newestLine = this.totalLinesAdded - 1;

		// Check if the requested range is available
		if (
			absoluteStartLine > newestLine ||
			absoluteStartLine + count <= oldestLine
		) {
			return [];
		}

		// Convert absolute position to relative position within current buffer
		const relativeStart = absoluteStartLine - oldestLine;
		const relativeEnd = Math.min(relativeStart + count, this.lines.length);
		const actualStart = Math.max(0, relativeStart);

		return this.lines.slice(actualStart, relativeEnd);
	}

	getOldestAvailableLineNumber(): number {
		return this.totalLinesAdded - this.lines.length;
	}

	isPositionValid(absolutePosition: number): boolean {
		const oldestLine = this.getOldestAvailableLineNumber();
		return (
			absolutePosition >= oldestLine && absolutePosition < this.totalLinesAdded
		);
	}

	getCurrentEndPosition(): number {
		return this.lines.length;
	}

	getTotalLines(): number {
		return this.lines.length;
	}

	clear(): void {
		this.lines = [];
		this.searchIndex.removeAll();
		this.nextId = 0;
		this.totalLinesAdded = 0;
	}

	search(
		query: string,
	): Array<{ text: string; lineNumber: number; score: number }> {
		if (!query.trim()) {
			return [];
		}

		const results = this.searchIndex.search(query, {
			fuzzy: 0.2,
		});

		return results.map((result) => ({
			text: result.text,
			lineNumber: result.lineNumber,
			score: result.score,
		}));
	}
}

async function readStreamToBuffer(
	stream: ReadableStream<Uint8Array> | null,
	logBuffer: LogBuffer,
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
