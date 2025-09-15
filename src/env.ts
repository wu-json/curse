import { type } from "arktype";

const envSchema = type({
	"LOG_BUFFER_SIZE?": [
		"string",
		"=>",
		(logBufferSize) => Number(logBufferSize) ?? 10_000,
	],
	SHELL: ["string", "=>", (shell: string) => shell ?? "/bin/sh"],
});

const parsedEnv = envSchema(process.env);

if (parsedEnv instanceof type.errors) {
	console.error("Environment validation failed:", parsedEnv.summary);
	process.exit(1);
}

export const ENV = parsedEnv;
