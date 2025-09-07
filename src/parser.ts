import { type } from "arktype";
import toml from "toml";

const MarionetteProcessConfig = type({
	command: "string",
});

const MarionetteConfig = type({
	name: "string",
	"[string]": MarionetteProcessConfig,
});

export type MarionetteConfig = typeof MarionetteConfig.infer;

export async function parseMarionetteConfig(
	path: string,
): Promise<MarionetteConfig> {
	if (!path.endsWith(".toml")) {
		throw new Error(`Path must point to toml file: ${path}`);
	}
	const file = Bun.file(path);
	const contents = await file.text();
	const result = MarionetteConfig(toml.parse(contents));
	if (result instanceof type.errors) {
		throw new Error("Failed to parse marionette config");
	}
	return result;
}
