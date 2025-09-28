import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const targets: Bun.Build.Target[] = [
	"bun-linux-x64",
	"bun-linux-arm64",
	"bun-darwin-x64",
	"bun-darwin-arm64",
];

console.log("Building curse for multiple targets...");

if (!existsSync("dist")) {
	await mkdir("dist", { recursive: true });
}

for (const target of targets) {
	console.log(`Building for ${target}...`);

	const result = await Bun.build({
		entrypoints: ["src/index.ts"],
		outdir: "dist",
		minify: true,
		compile: { target, outfile: `curse-${target}` },
	});

	if (!result.success) {
		console.error(`Failed to build ${target}:`);
		for (const log of result.logs) {
			console.error(log);
		}
		process.exit(1);
	}

	console.log(`✓ Built curse-${target}`);
}

console.log("All builds completed successfully!");
console.log("Built targets:");
for (const target of targets) {
	console.log(`  - dist/curse-${target}`);
}
