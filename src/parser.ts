import { type } from "arktype";
import toml from "toml";

const CurseConfig = type({
	"+": "delete",
	version: type("0"),
	process: type({
		name: "string",
		command: "string",
		"readiness_probe?": type({
			type: "'http'",
			host: "string",
			path: "string",
			port: "number",
		}).or({
			type: "'exec'",
			command: "string",
		}),
		"deps?": type({
			name: "string",
			condition: "'started' | 'succeeded' | 'ready'",
		}).array(),
		"env?": "Record<string, string | number>",
	}).array(),
});

export type CurseConfig = typeof CurseConfig.infer & {
	fileName: string;
};

export async function parseCurseConfig(path: string): Promise<CurseConfig> {
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

	const fileName = path.split("/").pop() || path;

	return {
		...result,
		fileName,
	};
}
