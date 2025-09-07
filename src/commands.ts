import { command, type Command, string } from "@drizzle-team/brocli";

const startCmd = command({
	name: "start",
	options: {
		path: string().default("./marionette.toml"),
	},
	handler: (opts) => {},
});

export const commands: Command[] = [startCmd];
