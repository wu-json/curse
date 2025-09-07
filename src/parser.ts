import { type } from "arktype";

const MarionetteProcessConfig = type({
	command: "string",
});

const MarionetteConfig = type({
	name: "string",
	"[string]": MarionetteProcessConfig,
});

export type MarionetteConfig = typeof MarionetteConfig.infer;

async function parseMarionetteConfig(path: string): MarionetteConfig {
	const file = Bun.file(path);
	const contents = await file.text();

	// TODO toml parser

	const result = MarionetteConfig(contents);
	if (result instanceof type.errors) {
		throw new Error("Failed to parse marionette config");
	}
	return result;
}
