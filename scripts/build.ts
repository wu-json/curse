import { existsSync } from "fs";
import { mkdir, unlink, readdir } from "fs/promises";

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
		outdir: `dist/curse-${target}`,
		minify: true,
		compile: { target, outfile: `curse` },
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

// Cleanup .bun-build files
console.log("Cleaning up temporary .bun-build files...");
try {
	const files = await readdir(".");
	const bunBuildFiles = files.filter((file) => file.endsWith(".bun-build"));

	for (const file of bunBuildFiles) {
		await unlink(file);
		console.log(`✓ Removed ${file}`);
	}

	if (bunBuildFiles.length === 0) {
		console.log("No .bun-build files to clean up");
	}
} catch (error) {
	console.warn("Warning: Failed to clean up .bun-build files:", error);
}
