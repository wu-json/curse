export type ProcessStatus = "idle" | "error" | "success";

export type Process = {
	name: string;
	command: string;
	status: ProcessStatus;
	startedAt?: Date;
};
