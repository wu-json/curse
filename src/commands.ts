import { command, type Command, string } from "@drizzle-team/brocli";

import { parseMarionetteConfig } from "./parser";

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

		const configPath = opts.path ?? "marionette.toml";
		const fileExists = await Bun.file(configPath).exists();
		if (!fileExists) {
			console.error(`marionette.toml file not found at path: ${configPath}`);
		}

		const result = await parseMarionetteConfig(configPath);
	},
});

export const commands: Command[] = [startCmd];
