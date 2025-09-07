import { run } from "@drizzle-team/brocli";

import { commands } from "./commands";

run(commands, {
	name: "marionette",
	description: "Marionette CLI",
	version: "0.0.0",
});
