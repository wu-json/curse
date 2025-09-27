import { cli, define } from "gunshi";
import { resolve } from "path";

import { parseCurseConfig } from "./parser";
import { renderView } from "./ui/view";

function makeCursePath(rawPath: string): string {
	if (rawPath.startsWith("/")) {
		return rawPath;
	}
	return resolve(process.cwd(), rawPath);
}

const command = define({
	name: "curse",
	args: {
		path: {
			type: "string",
			short: "p",
			default: "./curse.toml",
		},
	},
	// The 'ctx' parameter is automatically typed based on the args
	run: async (ctx) => {
		if (ctx.values.path && !ctx.values.path.endsWith(".toml")) {
			console.error(
				`Path does not point to curse.toml file: ${ctx.values.path}`,
			);
			process.exit(1);
		}

		const configPath = makeCursePath(ctx.values.path ?? "curse.toml");

		const fileExists = await Bun.file(configPath).exists();
		if (!fileExists) {
			console.error(`curse.toml file not found at path: ${configPath}`);
			process.exit(1);
		}

		const config = await parseCurseConfig(configPath);
		if (!config.process.length) {
			console.error(`curse.toml file has no processes`);
			process.exit(1);
		}

		renderView(config);
	},
});

await cli(process.argv.slice(2), command, {
	name: "curse",
	version: "0.0.0",
	description: "Manage processes in your terminal.",
	usageSilent: true,
});
