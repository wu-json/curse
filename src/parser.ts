import { type } from "arktype";
import toml from "toml";

const MarionetteConfig = type({
	"+": "delete",
	name: "string",
	process: type({
		name: "string",
		command: "string",
		"readiness_probe?": {
			type: "'http'",
			host: "string",
			path: "string",
			port: "number",
		},
	}).array(),
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

	const processNames = result.process.map((p) => p.name);
	const uniqueNames = new Set(processNames);
	if (processNames.length !== uniqueNames.size) {
		const duplicates = processNames.filter(
			(name, index) => processNames.indexOf(name) !== index,
		);
		throw new Error(
			`Duplicate process names found: ${[...new Set(duplicates)].join(", ")}`,
		);
	}

	return result;
}
