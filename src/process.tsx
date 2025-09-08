import { createContext, useContext, useState } from "react";

import type { MarionetteConfig } from "./parser";

export type ProcessStatus = "idle" | "error" | "success";

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
};

const ProcessManagerCtx = createContext<ProcessManagerCtx>({
	processes: [],
	selectedProcessIdx: 0,
	setProcesses: () => {},
	setSelectedProcessIdx: () => {},
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
			status: "idle",
		})),
	);
	return (
		<ProcessManagerCtx.Provider
			value={{
				processes,
				selectedProcessIdx,
				setProcesses,
				setSelectedProcessIdx,
			}}
		>
			{props.children}
		</ProcessManagerCtx.Provider>
	);
}

export function useProcessManager() {
	return useContext(ProcessManagerCtx);
}
