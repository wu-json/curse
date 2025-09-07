import { command, type Command, string } from "@drizzle-team/brocli";

const startCmd = command({
	name: "start",
	desc: "run marionette in your terminal",
	options: {
		path: string().alias("p").default("./marionette.toml"),
	},
	handler: (opts) => {
		console.log(opts.path);
	},
});

export const commands: Command[] = [startCmd];
