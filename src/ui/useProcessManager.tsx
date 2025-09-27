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

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	deps?: string[];
	env?: Record<string, string>;
	isReady?: boolean;
	readinessProbe?: MarionetteConfig["process"][0]["readiness_probe"];
	readinessTimer?: NodeJS.Timeout;
	readinessProbeInProgress?: boolean;
	proc?: Subprocess;
	startedAt?: Date;
	logBuffer: LogBuffer;
};

type UpdateProcessFields = {
	proc?: Subprocess;
	status?: ProcessStatus;
	startedAt?: Date;
	isReady?: boolean;
	readinessTimer?: NodeJS.Timeout;
	readinessProbeInProgress?: boolean;
};

async function performReadinessProbe(
	probe: NonNullable<Process["readinessProbe"]>,
): Promise<boolean> {
	try {
		const url = `http://${probe.host}:${probe.port}${probe.path}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3_000);

		const response = await fetch(url, {
			method: "GET",
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		return response.ok;
	} catch {
		return false;
	}
}

function startReadinessTimer(
	process: Process,
	updateProcess: (updates: UpdateProcessFields) => void,
): NodeJS.Timeout | undefined {
	if (!process.readinessProbe) {
		return undefined;
	}

	const timer = setInterval(async () => {
		if (process.readinessProbeInProgress) {
			return;
		}

		updateProcess({ readinessProbeInProgress: true });
		const isReady = await performReadinessProbe(process.readinessProbe!);
		updateProcess({ isReady, readinessProbeInProgress: false });
	}, 500);

	return timer;
}

function clearReadinessTimer(timer?: NodeJS.Timeout) {
	if (timer) {
		clearInterval(timer);
	}
}

function areDependenciesSatisfied(
	process: Process,
	allProcesses: Process[],
): boolean {
	if (!process.deps || process.deps.length === 0) {
		return true;
	}

	return process.deps.every((depName) => {
		const depProcess = allProcesses.find((p) => p.name === depName);
		if (!depProcess) {
			return false;
		}

		if (depProcess.readinessProbe) {
			return depProcess.isReady === true;
		} else {
			return depProcess.status !== ProcessStatus.Pending;
		}
	});
}

async function execProcess({
	process: p,
	updateProcess,
}: {
	process: Process;
	updateProcess: (updates: UpdateProcessFields) => void;
}): Promise<void> {
	updateProcess({
		status: ProcessStatus.Starting,
		startedAt: new Date(),
	});

	p.logBuffer.clear();

	const parsedCommand = parseShellCommand(p.command);
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
		env: p.env,
	});

	const readinessTimer = startReadinessTimer(p, updateProcess);
	updateProcess({ status: ProcessStatus.Running, proc, readinessTimer });

	readStreamToBuffer(proc.stdout, p.logBuffer);
	readStreamToBuffer(proc.stderr, p.logBuffer);

	const result = await proc.exited;
	clearReadinessTimer(readinessTimer);
	updateProcess({
		status: result === 0 ? ProcessStatus.Success : ProcessStatus.Error,
		readinessTimer: undefined,
		isReady: undefined,
		readinessProbeInProgress: false,
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
			deps: p.deps,
			env: p.env,
			isReady: p.readiness_probe ? false : undefined,
			readinessProbe: p.readiness_probe,
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
			if (
				p.status === ProcessStatus.Pending &&
				areDependenciesSatisfied(p, processes)
			) {
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
		const { proc, status, readinessTimer } = processes[processIdx];
		if (!proc || status !== ProcessStatus.Running) {
			return;
		}
		updateProcess(processIdx, { status: ProcessStatus.Killing });

		clearReadinessTimer(readinessTimer);

		proc.kill("SIGTERM");
		const timeout = setTimeout(() => {
			if (!proc.killed) {
				proc.kill("SIGKILL");
			}
		}, 5000);

		await proc.exited;
		clearTimeout(timeout);
		updateProcess(processIdx, {
			status: ProcessStatus.Killed,
			readinessTimer: undefined,
			isReady: undefined,
			readinessProbeInProgress: false,
		});
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
