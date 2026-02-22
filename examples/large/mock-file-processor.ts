#!/usr/bin/env node

console.log("[FILE-PROCESSOR] Starting file processing service...");

let processedFiles = 0;
const watchedDirectories = ["/uploads", "/temp", "/imports", "/documents"];

const fileTypes = [
	{ ext: "pdf", action: "OCR scanning" },
	{ ext: "jpg", action: "thumbnail generation" },
	{ ext: "mp4", action: "transcoding" },
	{ ext: "csv", action: "data validation" },
	{ ext: "xlsx", action: "parsing" },
	{ ext: "zip", action: "extraction" },
	{ ext: "docx", action: "text extraction" },
];

const _statuses = ["processing", "completed", "failed", "queued"];

function simulateFileProcessing() {
	if (Math.random() > 0.6) {
		const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
		const fileName = `file_${Math.random().toString(36).substring(2, 8)}.${fileType.ext}`;
		const directory = watchedDirectories[Math.floor(Math.random() * watchedDirectories.length)];
		const fileSize = (Math.random() * 50 + 1).toFixed(2);

		console.log(`[FILE-PROCESSOR] New file detected: ${directory}/${fileName} (${fileSize}MB)`);
		console.log(`[FILE-PROCESSOR] Starting ${fileType.action} for ${fileName}...`);

		const processingTime = Math.random() * 5000 + 2000;
		setTimeout(() => {
			if (Math.random() > 0.15) {
				processedFiles++;
				console.log(`[FILE-PROCESSOR] ${fileType.action} completed for ${fileName}`);
				console.log(`[FILE-PROCESSOR] Output saved to /processed/${fileName}`);
			} else {
				console.log(
					`[FILE-PROCESSOR] ${fileType.action} failed for ${fileName}: Corrupted file format`,
				);
			}
		}, processingTime);
	}

	if (Math.random() > 0.85) {
		const directory = watchedDirectories[Math.floor(Math.random() * watchedDirectories.length)];
		const fileCount = Math.floor(Math.random() * 5) + 1;
		console.log(`[FILE-PROCESSOR] Scanning ${directory}... found ${fileCount} new files`);
	}

	if (Math.random() > 0.9) {
		console.log(
			`[FILE-PROCESSOR] Status: ${processedFiles} files processed, disk usage: ${(Math.random() * 40 + 30).toFixed(1)}%`,
		);
	}
}

console.log("[FILE-PROCESSOR] Watching directories:", watchedDirectories.join(", "));
console.log("[FILE-PROCESSOR] Supported formats: PDF, JPG, MP4, CSV, XLSX, ZIP, DOCX");
console.log("[FILE-PROCESSOR] File processor ready");

setInterval(simulateFileProcessing, 2000 + Math.random() * 3000);

process.on("SIGTERM", () => {
	console.log("[FILE-PROCESSOR] Received SIGTERM, finishing current processing...");
	console.log("[FILE-PROCESSOR] File processor stopped");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[FILE-PROCESSOR] Received SIGINT, finishing current processing...");
	console.log("[FILE-PROCESSOR] File processor stopped");
	process.exit(0);
});
