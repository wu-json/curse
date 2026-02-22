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
await new Promise((resolve) => setTimeout(resolve, 4000));

let requestCount = 0;
let staticFileRequests = 0;
const pages = ["/", "/about", "/contact", "/login", "/dashboard", "/profile"];
const staticFiles = ["/css/style.css", "/js/app.js", "/images/logo.png", "/favicon.ico"];

const server = Bun.serve({
	port: process.env.PORT ?? 8002,
	fetch(req) {
		const url = new URL(req.url);
		requestCount++;

		if (url.pathname === "/health") {
			console.log(
				`[${process.env.SERVICE_NAME}] Health check accessed (${requestCount} total requests)`,
			);
			return new Response("OK", { status: 200 });
		}

		// Simulate static file requests
		if (staticFiles.some((file) => url.pathname.startsWith(file.split("/")[1]))) {
			staticFileRequests++;
			const responseTime = Math.random() * 50 + 10;

			setTimeout(() => {
				console.log(
					`[${process.env.SERVICE_NAME}] Static file: ${url.pathname} (${responseTime.toFixed(0)}ms)`,
				);
			}, 0);

			return new Response("Static file content", {
				status: 200,
				headers: { "Content-Type": "text/plain" },
			});
		}

		// Simulate page requests
		if (pages.includes(url.pathname) || url.pathname === "/") {
			const responseTime = Math.random() * 500 + 100;
			const userAgent = req.headers.get("user-agent") || "Unknown";
			const isMobile = userAgent.includes("Mobile");

			setTimeout(() => {
				console.log(
					`[${process.env.SERVICE_NAME}] Page: ${url.pathname} - ${isMobile ? "Mobile" : "Desktop"} (${responseTime.toFixed(0)}ms)`,
				);
			}, 0);

			return new Response(
				`<!DOCTYPE html><html><body><h1>Welcome to ${url.pathname}</h1></body></html>`,
				{
					status: 200,
					headers: { "Content-Type": "text/html" },
				},
			);
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`[${process.env.SERVICE_NAME}] Web server running on http://localhost:${server.port}`);
console.log(`[${process.env.SERVICE_NAME}] Serving pages: ${pages.join(", ")}`);

// Simulate periodic activity
setInterval(
	() => {
		if (Math.random() > 0.6) {
			const uniqueVisitors = Math.floor(Math.random() * 50) + 10;
			console.log(
				`[${process.env.SERVICE_NAME}] Stats: ${uniqueVisitors} unique visitors, ${staticFileRequests} static files served`,
			);
		}

		if (Math.random() > 0.8) {
			console.log(
				`[${process.env.SERVICE_NAME}] Server load: ${(Math.random() * 100).toFixed(1)}% CPU, ${(Math.random() * 80 + 20).toFixed(1)}% Memory`,
			);
		}
	},
	6000 + Math.random() * 4000,
);
