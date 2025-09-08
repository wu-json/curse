import { type } from "arktype";
import toml from "toml";

const MarionetteConfig = type({
	"+": "delete",
	name: "string",
	process: type({ name: "string", command: "string" }).array(),
});

export type MarionetteConfig = typeof MarionetteConfig.infer;

export async function parseMarionetteConfig(
	path: string,
): Promise<MarionetteConfig> {
	const file = Bun.file(path);
	const contents = await file.text();
	const result = MarionetteConfig.assert(toml.parse(contents));
	if (result instanceof type.errors) {
		throw new Error("Failed to parse marionette config");
	}
	return result;
}
