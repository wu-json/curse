import { run } from "@drizzle-team/brocli";

import { commands } from "./commands";

run(commands, { name: "marionette", description: "Marionette CLI" });
