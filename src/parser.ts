import { type } from "arktype";
import toml from "toml";

const CurseConfig = type({
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
		"deps?": "string[]",
		"env?": "Record<string, string | number>",
	}).array(),
});

export type CurseConfig = typeof CurseConfig.infer;

export async function parseCurseConfig(
	path: string,
): Promise<CurseConfig> {
	const file = Bun.file(path);
	const contents = await file.text();
	const result = CurseConfig.assert(toml.parse(contents));
	if (result instanceof type.errors) {
		throw new Error("Failed to parse curse config");
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
