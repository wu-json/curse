import { cli, define, type CommandContext } from "gunshi";
import { resolve } from "path";

import { parseCurseConfig } from "./parser";
import { renderView } from "./ui/View.tsx";
import { version } from "./version";

function makeCursePath(rawPath: string): string {
	if (rawPath.startsWith("/")) {
		return rawPath;
	}
	return resolve(process.cwd(), rawPath);
}

async function resolveConfigPath(cliPath?: string): Promise<string | null> {
	if (cliPath) {
		// Priority 1: CLI path argument
		return makeCursePath(cliPath);
	}

	// Priority 2: curse.toml, Priority 3: curse.local.toml
	const curseToml = makeCursePath("curse.toml");
	const curseLocalToml = makeCursePath("curse.local.toml");

	if (await Bun.file(curseToml).exists()) {
		return curseToml;
	} else if (await Bun.file(curseLocalToml).exists()) {
		return curseLocalToml;
	} else {
		return null;
	}
}

const command = define({
	name: "curse",
	args: {
		path: {
			type: "string",
			short: "p",
		},
	},
	run: async (ctx) => {
		const configPath = await resolveConfigPath(ctx.values.path);
		if (!configPath) {
			if (ctx.values.path) {
				console.error(`Path does not point to .toml file: ${ctx.values.path}`);
			} else {
				console.error(
					"No config file found. Looking for curse.toml or curse.local.toml",
				);
			}
			process.exit(1);
		}

		const fileExists = await Bun.file(configPath).exists();
		if (!fileExists) {
			console.error(`Config file not found at path: ${configPath}`);
			process.exit(1);
		}

		const config = await parseCurseConfig(configPath);
		if (!config.process.length) {
			console.error(`Config file has no processes: ${configPath}`);
			process.exit(1);
		}

		renderView(config);
	},
});

async function renderHeader(ctx: CommandContext): Promise<string> {
	if (ctx.values.help) {
		return `${ctx.env.description} (curse v${version})`;
	}
	return "";
}

await cli(process.argv.slice(2), command, {
	name: "curse",
	version,
	description: "Manage processes in your terminal.",
	renderHeader,
});
