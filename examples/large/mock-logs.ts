#!/usr/bin/env node

console.log("[LOGS] Starting log aggregation service...");

let logsProcessed = 0;
const logSources = [
	"api-server",
	"web-server",
	"database",
	"cache",
	"queue-worker",
	"file-processor",
	"email-service",
	"analytics",
];

const logLevels = [
	{ level: "DEBUG", weight: 0.4, color: "\x1b[36m" },
	{ level: "INFO", weight: 0.3, color: "\x1b[32m" },
	{ level: "WARN", weight: 0.2, color: "\x1b[33m" },
	{ level: "ERROR", weight: 0.08, color: "\x1b[31m" },
	{ level: "FATAL", weight: 0.02, color: "\x1b[35m" },
];

const messages = [
	"User authentication successful",
	"Database connection established",
	"Cache miss for key user:123",
	"Email sent successfully",
	"File uploaded to storage",
	"API request completed",
	"Background job started",
	"Memory usage at 67%",
	"SSL certificate renewed",
	"Rate limit approached",
];

function getWeightedLevel() {
	const random = Math.random();
	let sum = 0;
	for (const { level, weight } of logLevels) {
		sum += weight;
		if (random <= sum) return level;
	}
	return "INFO";
}

function simulateLogAggregation() {
	if (Math.random() > 0.2) {
		const source = logSources[Math.floor(Math.random() * logSources.length)];
		const level = getWeightedLevel();
		const message = messages[Math.floor(Math.random() * messages.length)];
		const timestamp = new Date().toISOString();
		const requestId = Math.random().toString(36).substring(2, 8);

		console.log(`[LOGS] ${timestamp} [${level}] ${source}: ${message} (req: ${requestId})`);
		logsProcessed++;
	}

	if (Math.random() > 0.8) {
		const batchSize = Math.floor(Math.random() * 20) + 5;
		const source = logSources[Math.floor(Math.random() * logSources.length)];
		console.log(`[LOGS] Processing batch from ${source}: ${batchSize} log entries`);
		logsProcessed += batchSize;

		setTimeout(
			() => {
				console.log(`[LOGS] Batch indexed and stored in Elasticsearch`);
			},
			Math.random() * 1500 + 500,
		);
	}

	if (Math.random() > 0.85) {
		const errors = Math.floor(Math.random() * 3);
		const warnings = Math.floor(Math.random() * 8);
		console.log(`[LOGS] Alert summary: ${errors} errors, ${warnings} warnings in last 5 minutes`);
	}

	if (Math.random() > 0.9) {
		const avgProcessingTime = (Math.random() * 50 + 10).toFixed(2);
		console.log(
			`[LOGS] Performance: ${logsProcessed} logs processed, avg ${avgProcessingTime}ms per log`,
		);
	}

	if (Math.random() > 0.95) {
		console.log(`[LOGS] Running log rotation and cleanup...`);
		setTimeout(() => {
			const deletedLogs = Math.floor(Math.random() * 1000) + 500;
			console.log(`[LOGS] Cleanup completed: ${deletedLogs} old log entries archived`);
		}, 2000);
	}
}

console.log("[LOGS] Connected to log sources:", logSources.join(", "));
console.log("[LOGS] Elasticsearch cluster ready");
console.log("[LOGS] Log aggregation service ready");

setInterval(simulateLogAggregation, 400 + Math.random() * 800);

process.on("SIGTERM", () => {
	console.log("[LOGS] Received SIGTERM, flushing log buffer...");
	console.log("[LOGS] Log aggregation service stopped");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[LOGS] Received SIGINT, flushing log buffer...");
	console.log("[LOGS] Log aggregation service stopped");
	process.exit(0);
});
