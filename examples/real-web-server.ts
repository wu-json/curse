await new Promise((resolve) => setTimeout(resolve, 5000));

const server = Bun.serve({
	port: process.env.PORT ?? 9070,
	fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/health") {
			console.log(`[${new Date().toISOString()}] Health check accessed`);
			return new Response("OK", { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`Server running on http://localhost:${server.port}`);

process.on("SIGTERM", () => {
	console.log("Received SIGTERM, shutting down gracefully...");
	server.stop();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("Received SIGINT, shutting down gracefully...");
	server.stop();
	process.exit(0);
});
