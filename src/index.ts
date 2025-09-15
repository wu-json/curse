import { cli, define } from "gunshi";
import { resolve } from "path";

import { parseMarionetteConfig } from "./parser";
import { renderView } from "./ui/view";

function makeMarionettePath(rawPath: string): string {
	if (rawPath.startsWith("/")) {
		return rawPath;
	}
	return resolve(process.cwd(), rawPath);
}

const command = define({
	name: "marionette",
	args: {
		path: {
			type: "string",
			short: "p",
			default: "./marionette.toml",
		},
	},
	// The 'ctx' parameter is automatically typed based on the args
	run: async (ctx) => {
		if (ctx.values.path && !ctx.values.path.endsWith(".toml")) {
			console.error(
				`Path does not point to marionette.toml file: ${ctx.values.path}`,
			);
			process.exit(1);
		}

		const configPath = makeMarionettePath(ctx.values.path ?? "marionette.toml");

		const fileExists = await Bun.file(configPath).exists();
		if (!fileExists) {
			console.error(`marionette.toml file not found at path: ${configPath}`);
			process.exit(1);
		}

		const config = await parseMarionetteConfig(configPath);
		if (!config.process.length) {
			console.error(`marionette.toml file has no processes`);
			process.exit(1);
		}

		renderView(config);
	},
});

await cli(process.argv.slice(2), command, {
	name: "marionette",
	version: "0.0.0",
	description: "Manage processes in your terminal.",
	usageSilent: true,
});
