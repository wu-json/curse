process.on("SIGTERM", () => {
	console.log(`[${process.env.SERVICE_NAME}] Received SIGTERM, shutting down gracefully...`);
	server.stop();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log(`[${process.env.SERVICE_NAME}] Received SIGINT, shutting down gracefully...`);
	server.stop();
	process.exit(0);
});

console.log(`[${process.env.SERVICE_NAME}] Starting up...`);

// Simulate startup time
await new Promise((resolve) => setTimeout(resolve, 3000));

let requestCount = 0;
const endpoints = ["/users", "/orders", "/products", "/auth/login", "/health"];

const server = Bun.serve({
	port: process.env.PORT ?? 8001,
	fetch(req) {
		const url = new URL(req.url);
		requestCount++;

		if (url.pathname === "/health") {
			console.log(
				`[${process.env.SERVICE_NAME}] Health check accessed (${requestCount} total requests)`,
			);
			return new Response("OK", { status: 200 });
		}

		// Simulate API endpoint activity
		if (endpoints.includes(url.pathname)) {
			const method = req.method;
			const responseTime = Math.random() * 200 + 50;
			const statusCode = Math.random() > 0.95 ? 500 : Math.random() > 0.9 ? 404 : 200;

			setTimeout(() => {
				console.log(
					`[${process.env.SERVICE_NAME}] ${method} ${url.pathname} - ${statusCode} (${responseTime.toFixed(0)}ms)`,
				);
			}, 0);

			return new Response(
				JSON.stringify({
					status: statusCode === 200 ? "success" : "error",
					endpoint: url.pathname,
					timestamp: new Date().toISOString(),
				}),
				{
					status: statusCode,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`[${process.env.SERVICE_NAME}] API server running on http://localhost:${server.port}`);
console.log(`[${process.env.SERVICE_NAME}] Available endpoints: ${endpoints.join(", ")}`);

// Simulate periodic activity
setInterval(
	() => {
		if (Math.random() > 0.7) {
			const activeConnections = Math.floor(Math.random() * 20);
			console.log(
				`[${process.env.SERVICE_NAME}] Active connections: ${activeConnections}, Total requests: ${requestCount}`,
			);
		}
	},
	5000 + Math.random() * 5000,
);
