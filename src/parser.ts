import { type } from "arktype";
import toml from "toml";

const CurseConfig = type({
	"+": "delete",
	version: type("0"),

	// Lifecycle hooks
	"hooks?": type({
		"startup?": type({
			name: "string",
			command: "string",
		}),
		"shutdown?": type({
			name: "string",
			command: "string",
		}),
	}),

	// Processes
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
		console.error("Failed to parse curse config");
		process.exit(1);
	}

	// Check for duplicate names across processes and hooks
	const allNames: string[] = result.process.map((p) => p.name);
	if (result.hooks?.startup) {
		allNames.push(result.hooks.startup.name);
	}
	if (result.hooks?.shutdown) {
		allNames.push(result.hooks.shutdown.name);
	}

	const uniqueNames = new Set(allNames);
	if (allNames.length !== uniqueNames.size) {
		const duplicates = allNames.filter((name, index) => allNames.indexOf(name) !== index);
		console.error(`Duplicate names found: ${[...new Set(duplicates)].join(", ")}`);
		process.exit(1);
	}

	// Validate that all dependency names reference actual processes
	const processNames = new Set(result.process.map((p) => p.name));
	for (const proc of result.process) {
		if (proc.deps) {
			for (const dep of proc.deps) {
				if (!processNames.has(dep.name)) {
					console.error(
						`Process "${proc.name}" has dependency "${dep.name}" which is not defined in the config`,
					);
					process.exit(1);
				}
			}
		}
	}

	const fileName = path.split("/").pop() || path;

	return {
		...result,
		fileName,
	};
}
