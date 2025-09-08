import { command, type Command, string } from "@drizzle-team/brocli";
import { resolve } from "path";

import { parseMarionetteConfig } from "./parser";
import { renderView } from "./view";

function makeMarionettePath(rawPath: string): string {
	if (rawPath.startsWith("/")) {
		return rawPath;
	}
	return resolve(process.cwd(), rawPath);
}

const startCmd = command({
	name: "start",
	desc: "run marionette in your terminal",
	options: {
		path: string().alias("p").default("./marionette.toml"),
	},
	handler: async (opts) => {
		if (opts.path && !opts.path.endsWith(".toml")) {
			console.error(
				`Path does not point to marionette.toml file: ${opts.path}`,
			);
			process.exit(1);
		}

		const configPath = makeMarionettePath(opts.path ?? "marionette.toml");

		const fileExists = await Bun.file(configPath).exists();
		if (!fileExists) {
			console.error(`marionette.toml file not found at path: ${configPath}`);
			process.exit(1);
		}

		const config = await parseMarionetteConfig(configPath);
		if (!config.command.length) {
			console.error(`marionette.toml file has no commands`);
			process.exit(1);
		}

		renderView(config);
	},
});

export const commands: Command[] = [startCmd];
