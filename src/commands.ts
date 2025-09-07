import { command, type Command, string } from "@drizzle-team/brocli";

const startCmd = command({
	name: "start",
	desc: "run marionette in your terminal",
	options: {
		path: string().alias("p").default("./marionette.toml"),
	},
	handler: (opts) => {
		if (opts.path && !opts.path.endsWith(".toml")) {
			console.error(
				`Path does not point to marionette.toml file: ${opts.path}`,
			);
			process.exit(1);
		}
		console.log(opts.path);
	},
});

export const commands: Command[] = [startCmd];
