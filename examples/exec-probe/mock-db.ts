// Mock database service that serves a health endpoint

import { serve } from "bun";

let isReady = false;

console.log("Database starting...");
console.log("Initializing database schema and connections...");

// Simulate database initialization taking 7 seconds
setTimeout(() => {
	isReady = true;
	console.log("Database is now ready to accept connections!");
}, 7000);

const server = serve({
	port: 5432,
	fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/health") {
			if (isReady) {
				return new Response("OK", { status: 200 });
			} else {
				return new Response("Database initializing...", { status: 503 });
			}
		}

		return new Response("Database Mock", { status: 200 });
	},
});

console.log(`Mock database running on port ${server.port}`);
