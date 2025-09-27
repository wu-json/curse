import { type } from "arktype";

const envSchema = type({
	"LOG_BUFFER_SIZE?": [
		"string",
		"=>",
		(logBufferSize) => Number(logBufferSize),
	],
	"SHELL?": "string",
});

const parsedEnv = envSchema(process.env);

if (parsedEnv instanceof type.errors) {
	console.error("Environment validation failed:", parsedEnv.summary);
	process.exit(1);
}

export const ENV = parsedEnv;
