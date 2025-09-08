import { createContext, useContext, useState } from "react";

import type { MarionetteConfig } from "./parser";

export enum ProcessStatus {
	Pending = "pending",
	Started = "started",
	Error = "error",
	Idle = "idle",
}

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	startedAt?: Date;
};

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

	const updateProcessStatus = (processIdx: number, status: ProcessStatus) => {
		setProcesses((prev) =>
			prev.map((process, i) =>
				i === processIdx ? { ...process, status } : process,
			),
		);
	};

	const runPendingProcesses = () => {
		processes.map((p, i) => {
			if (p.status === ProcessStatus.Pending) {
				// TODO: actually start the process
				updateProcessStatus(i, ProcessStatus.Started);
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
