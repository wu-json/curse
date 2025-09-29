import {
	createContext,
	useContext,
	useMemo,
	useState,
	useCallback,
	useEffect,
} from "react";
import { spawn, type Subprocess } from "bun";
import { LogBuffer, readStreamToBuffer } from "../lib/LogBuffer";

import type { CurseConfig } from "../parser";
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

export type ProcessProfile = {
	memoryUsageMB: number;
	cpuUsagePercent: number;
	lastUpdated: Date;
};

export type ProcessType = "process" | "startup_hook" | "shutdown_hook";

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	type: ProcessType;
	deps?: { name: string; condition: "started" | "succeeded" | "ready" }[];
	env?: Record<string, string | number>;
	isReady?: boolean;
	readinessProbe?: CurseConfig["process"][0]["readiness_probe"];
	readinessTimer?: NodeJS.Timeout;
	readinessProbeInProgress?: boolean;
	proc?: Subprocess;
	startedAt?: Date;
	logBuffer: LogBuffer;
	profile?: ProcessProfile;
	profileTimer?: NodeJS.Timeout;
};

type UpdateProcessFields = {
	proc?: Subprocess;
	status?: ProcessStatus;
	startedAt?: Date;
	isReady?: boolean;
	readinessTimer?: NodeJS.Timeout;
	readinessProbeInProgress?: boolean;
	profile?: ProcessProfile;
	profileTimer?: NodeJS.Timeout;
};

async function performReadinessProbe(
	probe: NonNullable<Process["readinessProbe"]>,
): Promise<boolean> {
	try {
		if (probe.type === "http") {
			const url = `http://${probe.host}:${probe.port}${probe.path}`;
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3_000);

			const response = await fetch(url, {
				method: "GET",
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			return response.ok;
		} else if (probe.type === "exec") {
			const proc = spawn({
				cmd: ["sh", "-c", probe.command],
				stdout: "ignore",
				stderr: "ignore",
			});

			const result = await proc.exited;
			return result === 0;
		}

		return false;
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

		// Start profiling timer if process is running and we don't have one yet
		if (!process.profileTimer && process.proc) {
			const profileTimer = startProfileTimer(process.proc, updateProcess);
			updateProcess({
				isReady,
				readinessProbeInProgress: false,
				...(isReady ? { status: ProcessStatus.Running } : {}),
				profileTimer,
			});
		} else {
			updateProcess({
				isReady,
				readinessProbeInProgress: false,
				...(isReady ? { status: ProcessStatus.Running } : {}),
			});
		}
	}, 1_000);

	return timer;
}

function clearReadinessTimer(timer?: NodeJS.Timeout) {
	if (timer) {
		clearInterval(timer);
	}
}

async function getProcessProfile(
	proc: Subprocess,
): Promise<ProcessProfile | null> {
	if (!proc.pid) return null;

	try {
		const psResult = spawn({
			cmd: ["ps", "-o", "rss,pcpu", "-p", proc.pid.toString()],
			stdout: "pipe",
		});

		const output = await new Response(psResult.stdout).text();
		const [, dataLine] = output.trim().split("\n");
		if (!dataLine) return null;

		const [memoryStr, cpuStr] = dataLine.trim().split(/\s+/);
		if (!memoryStr || !cpuStr) return null;

		return {
			memoryUsageMB: Math.round((parseInt(memoryStr) || 0) / 1024),
			cpuUsagePercent: parseFloat(cpuStr) || 0,
			lastUpdated: new Date(),
		};
	} catch {
		return null;
	}
}

function startProfileTimer(
	proc: Subprocess,
	updateProcess: (updates: UpdateProcessFields) => void,
): NodeJS.Timeout {
	const timer = setInterval(async () => {
		const profile = await getProcessProfile(proc);
		if (profile) {
			updateProcess({ profile });
		}
	}, 2000); // Update every 2 seconds for performance

	return timer;
}

function clearProfileTimer(timer?: NodeJS.Timeout) {
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

	return process.deps.every((dep) => {
		const depProcess = allProcesses.find((p) => p.name === dep.name);
		if (!depProcess) {
			return false;
		}

		switch (dep.condition) {
			case "started":
				return (
					depProcess.status === ProcessStatus.Running ||
					depProcess.status === ProcessStatus.Success ||
					depProcess.isReady === true
				);
			case "succeeded":
				return depProcess.status === ProcessStatus.Success;
			case "ready":
				if (depProcess.readinessProbe) {
					return depProcess.isReady === true;
				} else {
					// If no readiness probe, consider it ready when running or succeeded
					return (
						depProcess.status === ProcessStatus.Running ||
						depProcess.status === ProcessStatus.Success
					);
				}
			default:
				return false;
		}
	});
}

function createEnv(
	processEnv?: Record<string, string | number>,
): Record<string, string | undefined> {
	const mappedEnv: Record<string, string> = {};
	if (processEnv) {
		for (const [key, value] of Object.entries(processEnv)) {
			mappedEnv[key] = String(value);
		}
	}

	return {
		...Bun.env,
		...mappedEnv,
	};
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

	const proc = spawn({
		cmd: ["sh", "-c", p.command],
		stdout: "pipe",
		stderr: "pipe",
		env: createEnv(p.env),
	});

	let profileTimer: NodeJS.Timeout | undefined;
	let readinessTimer: NodeJS.Timeout | undefined;

	if (p.readinessProbe) {
		// Update process with proc first
		p.proc = proc;
		updateProcess({ proc });
		readinessTimer = startReadinessTimer(p, updateProcess);
		updateProcess({ readinessTimer });
	} else {
		profileTimer = startProfileTimer(proc, updateProcess);
		updateProcess({
			status: ProcessStatus.Running,
			proc,
			profileTimer,
		});
	}

	readStreamToBuffer(proc.stdout, p.logBuffer);
	readStreamToBuffer(proc.stderr, p.logBuffer);

	const result = await proc.exited;
	clearReadinessTimer(readinessTimer);
	if (profileTimer) {
		clearProfileTimer(profileTimer);
	}
	updateProcess({
		status: result === 0 ? ProcessStatus.Success : ProcessStatus.Error,
		readinessTimer: undefined,
		profileTimer: undefined,
		isReady: undefined,
		readinessProbeInProgress: false,
		profile: undefined,
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
	runStartupHook: () => Promise<void>;
	runShutdownHook: () => Promise<void>;
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
	runStartupHook: async () => {},
	runShutdownHook: async () => {},
});

export function ProcessManagerProvider(props: {
	config: CurseConfig;
	children: React.ReactNode;
}) {
	const [selectedProcessIdx, setSelectedProcessIdx] = useState(0);
	const [processes, setProcesses] = useState<Process[]>(() => {
		const allProcesses: Process[] = [];

		// Add startup hook if present
		if (props.config.hooks?.startup) {
			allProcesses.push({
				name: props.config.hooks.startup.name,
				command: props.config.hooks.startup.command,
				status: ProcessStatus.Pending,
				type: "startup_hook",
				logBuffer: new LogBuffer(ENV.LOG_BUFFER_SIZE ?? 5_000),
			});
		}

		// Add regular processes
		allProcesses.push(
			...props.config.process.map((p) => ({
				name: p.name,
				command: p.command,
				status: ProcessStatus.Pending,
				type: "process" as const,
				deps: p.deps,
				env: p.env,
				isReady: p.readiness_probe ? false : undefined,
				readinessProbe: p.readiness_probe,
				logBuffer: new LogBuffer(ENV.LOG_BUFFER_SIZE ?? 5_000),
			})),
		);

		// Add shutdown hook if present
		if (props.config.hooks?.shutdown) {
			allProcesses.push({
				name: props.config.hooks.shutdown.name,
				command: props.config.hooks.shutdown.command,
				status: ProcessStatus.Pending,
				type: "shutdown_hook",
				logBuffer: new LogBuffer(ENV.LOG_BUFFER_SIZE ?? 5_000),
			});
		}

		return allProcesses;
	});

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

	const runPendingProcesses = useCallback(() => {
		// Check if startup hook exists and hasn't completed
		const startupHook = processes.find((p) => p.type === "startup_hook");
		const isStartupComplete =
			!startupHook || startupHook.status === ProcessStatus.Success;

		processes.map((p, i) => {
			if (
				p.status === ProcessStatus.Pending &&
				p.type === "process" &&
				isStartupComplete && // Only run processes after startup hook completes
				areDependenciesSatisfied(p, processes)
			) {
				execProcess({
					process: p,
					updateProcess: (fields: UpdateProcessFields) =>
						updateProcess(i, fields),
				});
			}
		});
	}, [processes]);

	// Watch for processes becoming ready or completing successfully and trigger pending process checks
	useEffect(() => {
		const readyProcesses = processes.filter((p) => p.isReady === true);
		const successProcesses = processes.filter(
			(p) => p.status === ProcessStatus.Success,
		);
		if (readyProcesses.length > 0 || successProcesses.length > 0) {
			runPendingProcesses();
		}
	}, [
		processes.map((p) => p.isReady).join(","),
		processes.map((p) => p.status).join(","),
		runPendingProcesses,
	]);

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
		const { proc, status, readinessTimer, profileTimer } =
			processes[processIdx];
		if (!proc || status !== ProcessStatus.Running) {
			return;
		}
		updateProcess(processIdx, { status: ProcessStatus.Killing });

		clearReadinessTimer(readinessTimer);
		clearProfileTimer(profileTimer);

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
			profileTimer: undefined,
			isReady: undefined,
			readinessProbeInProgress: false,
			profile: undefined,
		});
	};

	const killSelectedProcess = async () => {
		await killProcess(selectedProcessIdx);
	};

	const runStartupHook = async () => {
		const startupHookIndex = processes.findIndex(
			(p) => p.type === "startup_hook",
		);
		if (startupHookIndex === -1) return;

		const startupHook = processes[startupHookIndex];
		if (!startupHook || startupHook.status !== ProcessStatus.Pending) return;

		await execProcess({
			process: startupHook,
			updateProcess: (fields: UpdateProcessFields) =>
				updateProcess(startupHookIndex, fields),
		});
	};

	const runShutdownHook = async () => {
		const shutdownHookIndex = processes.findIndex(
			(p) => p.type === "shutdown_hook",
		);
		if (shutdownHookIndex === -1) return;

		const shutdownHook = processes[shutdownHookIndex];
		if (!shutdownHook) return;

		// Reset shutdown hook to pending and run it
		updateProcess(shutdownHookIndex, { status: ProcessStatus.Pending });
		// Give it a moment to update state
		await new Promise((resolve) => setTimeout(resolve, 50));
		await execProcess({
			process: { ...shutdownHook, status: ProcessStatus.Pending },
			updateProcess: (fields: UpdateProcessFields) =>
				updateProcess(shutdownHookIndex, fields),
		});
	};

	const killAllProcesses = async () => {
		// Kill all regular processes first
		await Promise.all(
			processes.map(async (p, i) => {
				if (p.type === "process") {
					await killProcess(i);
				}
			}),
		);

		// Then run shutdown hook
		await runShutdownHook();
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
				runStartupHook,
				runShutdownHook,
			}}
		>
			{props.children}
		</ProcessManagerCtx.Provider>
	);
}

export function useProcessManager() {
	return useContext(ProcessManagerCtx);
}
