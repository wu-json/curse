import { type } from "arktype";

const envSchema = type({
	SHELL: ["string", "=>", (shell: string) => shell || "/bin/sh"],
});

const parsedEnv = envSchema(process.env);

if (parsedEnv instanceof type.errors) {
	console.error("Environment validation failed:", parsedEnv.summary);
	process.exit(1);
}

export const ENV = parsedEnv;

