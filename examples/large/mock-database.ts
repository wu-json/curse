#!/usr/bin/env node

console.log("[DATABASE] Starting database service...");

let connectionCount = 0;
const queries = [
	"SELECT * FROM users WHERE active = true",
	"INSERT INTO sessions (user_id, token) VALUES ($1, $2)",
	"UPDATE users SET last_login = NOW() WHERE id = $1",
	"DELETE FROM expired_tokens WHERE created_at < NOW() - INTERVAL '1 hour'",
	"SELECT COUNT(*) FROM orders WHERE status = 'pending'",
	"CREATE INDEX CONCURRENTLY idx_users_email ON users(email)",
];

const operations = [
	"Connection pool initialized with 20 connections",
	"Running database migration 20241201_001",
	"Vacuum operation completed",
	"Analyzing table statistics",
	"Backup process started",
	"Index optimization completed",
];

function simulateActivity() {
	if (Math.random() > 0.7) {
		connectionCount = Math.max(
			0,
			connectionCount + (Math.random() > 0.5 ? 1 : -1),
		);
		console.log(`[DATABASE] Active connections: ${connectionCount}/20`);
	}

	if (Math.random() > 0.8) {
		const query = queries[Math.floor(Math.random() * queries.length)];
		const duration = (Math.random() * 50 + 5).toFixed(2);
		console.log(
			`[DATABASE] Query executed in ${duration}ms: ${query.substring(0, 50)}...`,
		);
	}

	if (Math.random() > 0.9) {
		const operation = operations[Math.floor(Math.random() * operations.length)];
		console.log(`[DATABASE] ${operation}`);
	}
}

console.log("[DATABASE] Database service ready on port 5432");
console.log("[DATABASE] Connection pool: 0/20 connections");

setInterval(simulateActivity, 1000 + Math.random() * 2000);

process.on("SIGTERM", () => {
	console.log("[DATABASE] Received SIGTERM, closing connections...");
	console.log("[DATABASE] Database service stopped");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[DATABASE] Received SIGINT, closing connections...");
	console.log("[DATABASE] Database service stopped");
	process.exit(0);
});
