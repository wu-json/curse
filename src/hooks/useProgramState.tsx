import { createContext, useContext, useState } from "react";

export enum ProgramStatus {
	Running = "running",
	Quitting = "quitting",
}

type ProgramStateCtx = {
	status: ProgramStatus;
	setStatus: (status: ProgramStatus) => void;
};

const ProgramStateCtx = createContext<ProgramStateCtx>({
	status: ProgramStatus.Running,
	setStatus: () => {},
});

export function ProgramStateProvider(props: { children: React.ReactNode }) {
	const [status, setStatus] = useState<ProgramStatus>(ProgramStatus.Running);

	return (
		<ProgramStateCtx.Provider
			value={{
				status,
				setStatus,
			}}
		>
			{props.children}
		</ProgramStateCtx.Provider>
	);
}

export function useProgramState() {
	return useContext(ProgramStateCtx);
}
