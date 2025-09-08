import { useState } from "react";

import type { MarionetteConfig } from "./parser";

export type ProcessStatus = "idle" | "error" | "success";

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	startedAt?: Date;
};

export function useProcessManager(config: MarionetteConfig) {
	const [processes, setProcesses] = useState<Process[]>(
		config.process.map((p) => ({
			name: p.name,
			command: p.command,
			status: "idle",
		})),
	);
	return { processes, setProcesses };
}
