#!/usr/bin/env node

console.log("[BACKUP] Starting backup service...");

let backupsCompleted = 0;
const backupTargets = [
	{ name: "user_data", size: "2.3GB", type: "database" },
	{ name: "application_logs", size: "890MB", type: "files" },
	{ name: "configuration", size: "45MB", type: "config" },
	{ name: "media_assets", size: "15.7GB", type: "files" },
	{ name: "metrics_data", size: "1.2GB", type: "database" },
];

const storageProviders = ["AWS S3", "Google Cloud", "Azure Blob", "Local NAS"];

function simulateBackupActivity() {
	if (Math.random() > 0.85) {
		const target =
			backupTargets[Math.floor(Math.random() * backupTargets.length)];
		const provider =
			storageProviders[Math.floor(Math.random() * storageProviders.length)];
		const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

		console.log(
			`[BACKUP] Starting backup: ${target.name} (${target.size}) to ${provider}`,
		);
		console.log(`[BACKUP] Backup ID: ${backupId}`);

		// Simulate backup progress
		const totalSteps = Math.floor(Math.random() * 5) + 3;
		let currentStep = 0;

		const progressInterval = setInterval(
			() => {
				currentStep++;
				const percentage = Math.min(
					100,
					(currentStep / totalSteps) * 100,
				).toFixed(1);

				if (currentStep <= totalSteps) {
					console.log(`[BACKUP] ${backupId}: ${percentage}% complete...`);
				}

				if (currentStep >= totalSteps) {
					clearInterval(progressInterval);

					if (Math.random() > 0.1) {
						backupsCompleted++;
						const duration = (Math.random() * 300 + 60).toFixed(1);
						console.log(
							`[BACKUP] ${backupId}: Backup completed successfully in ${duration}s`,
						);
						console.log(
							`[BACKUP] ${backupId}: Verification passed, stored at ${provider}`,
						);
					} else {
						console.log(
							`[BACKUP] ${backupId}: Backup failed - Network timeout`,
						);
						console.log(
							`[BACKUP] ${backupId}: Scheduled for retry in 30 minutes`,
						);
					}
				}
			},
			Math.random() * 2000 + 1000,
		);
	}

	if (Math.random() > 0.9) {
		const freeSpace = (Math.random() * 500 + 100).toFixed(1);
		console.log(
			`[BACKUP] Storage status: ${backupsCompleted} completed today, ${freeSpace}GB free space`,
		);
	}

	if (Math.random() > 0.95) {
		console.log(`[BACKUP] Running integrity check on recent backups...`);
		setTimeout(() => {
			console.log(`[BACKUP] Integrity check completed: All backups verified`);
		}, 3000);
	}
}

console.log("[BACKUP] Backup service initialized");
console.log(
	"[BACKUP] Checking backup targets:",
	backupTargets.map((t) => t.name).join(", "),
);
console.log(
	"[BACKUP] Storage providers configured:",
	storageProviders.join(", "),
);
console.log("[BACKUP] Backup service ready");

setInterval(simulateBackupActivity, 5000 + Math.random() * 10000);

process.on("SIGTERM", () => {
	console.log("[BACKUP] Received SIGTERM, completing current backups...");
	console.log("[BACKUP] Backup service stopped");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[BACKUP] Received SIGINT, completing current backups...");
	console.log("[BACKUP] Backup service stopped");
	process.exit(0);
});
