import { run } from "@drizzle-team/brocli";

import { commands } from "./commands";
import { version } from "./version";

run(commands, {
	name: "marionette",
	description: "Marionette CLI",
	version,
});
