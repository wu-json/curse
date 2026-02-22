#!/usr/bin/env node

console.log("[ANALYTICS] Starting analytics service...");

let eventsProcessed = 0;
let activeUsers = 127;

const eventTypes = [
	"page_view",
	"button_click",
	"form_submit",
	"user_login",
	"purchase",
	"search",
	"video_play",
	"download",
	"share",
	"error",
];

const metrics = [
	"conversion_rate",
	"bounce_rate",
	"session_duration",
	"page_load_time",
	"user_engagement",
];

function simulateAnalyticsActivity() {
	if (Math.random() > 0.3) {
		const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
		const userId = `user_${Math.floor(Math.random() * 1000)}`;
		const timestamp = new Date().toISOString();

		console.log(`[ANALYTICS] Event: ${eventType} | User: ${userId} | ${timestamp}`);
		eventsProcessed++;

		// Simulate user activity changes
		if (eventType === "user_login") {
			activeUsers++;
		} else if (Math.random() > 0.95) {
			activeUsers = Math.max(50, activeUsers - 1);
		}
	}

	if (Math.random() > 0.8) {
		const batchSize = Math.floor(Math.random() * 50) + 10;
		console.log(`[ANALYTICS] Processing batch of ${batchSize} events...`);
		eventsProcessed += batchSize;

		setTimeout(
			() => {
				console.log(`[ANALYTICS] Batch processed and stored in data warehouse`);
			},
			Math.random() * 2000 + 500,
		);
	}

	if (Math.random() > 0.9) {
		const metric = metrics[Math.floor(Math.random() * metrics.length)];
		const value = (Math.random() * 100).toFixed(2);
		const unit = metric.includes("rate") ? "%" : metric.includes("time") ? "ms" : "";
		console.log(`[ANALYTICS] Metric update: ${metric} = ${value}${unit}`);
	}

	if (Math.random() > 0.95) {
		console.log(
			`[ANALYTICS] Status: ${eventsProcessed} events processed, ${activeUsers} active users`,
		);
	}
}

console.log("[ANALYTICS] Connected to event stream");
console.log("[ANALYTICS] Data warehouse connection established");
console.log("[ANALYTICS] Real-time analytics ready");

setInterval(simulateAnalyticsActivity, 600 + Math.random() * 1200);

process.on("SIGTERM", () => {
	console.log("[ANALYTICS] Received SIGTERM, flushing event buffer...");
	console.log("[ANALYTICS] Analytics service stopped");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[ANALYTICS] Received SIGINT, flushing event buffer...");
	console.log("[ANALYTICS] Analytics service stopped");
	process.exit(0);
});
