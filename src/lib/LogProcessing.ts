// Strip carriage returns from log lines to prevent display issues with terminal control characters
export function preprocessLog(log: string): string {
	return log.replace(/\r/g, "");
}
