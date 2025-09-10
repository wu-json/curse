import { createContext, useContext, useState } from "react";
import { $ } from "bun";

import type { MarionetteConfig } from "./parser";

export enum ProcessStatus {
	Pending = "pending",
	Started = "started",
	Running = "running",
	Error = "error",
	Idle = "idle",
}

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	startedAt?: Date;
};

type UpdateProcessFields = {
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
		status: ProcessStatus.Started,
		startedAt: new Date(),
	});

	try {
		updateProcess({ status: ProcessStatus.Running });
	} catch (error) {
		updateProcess({ status: ProcessStatus.Error });
		return;
	}

	const result = await $`${process.command}`.quiet();
	updateProcess({
		status: result.exitCode ? ProcessStatus.Idle : ProcessStatus.Error,
	});
}

type ProcessManagerCtx = {
	processes: Process[];
	selectedProcessIdx: number;
	setProcesses: React.Dispatch<React.SetStateAction<Process[]>>;
	setSelectedProcessIdx: React.Dispatch<React.SetStateAction<number>>;
	runPendingProcesses: () => void;
};

const ProcessManagerCtx = createContext<ProcessManagerCtx>({
	processes: [],
	selectedProcessIdx: 0,
	setProcesses: () => {},
	setSelectedProcessIdx: () => {},
	runPendingProcesses: () => {},
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
		})),
	);

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

	return (
		<ProcessManagerCtx.Provider
			value={{
				processes,
				selectedProcessIdx,
				setProcesses,
				setSelectedProcessIdx,
				runPendingProcesses,
			}}
		>
			{props.children}
		</ProcessManagerCtx.Provider>
	);
}

export function useProcessManager() {
	return useContext(ProcessManagerCtx);
}
