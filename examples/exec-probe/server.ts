// Web server that depends on database

import { serve } from "bun";

const server = serve({
	port: 3000,
	fetch(req) {
		return new Response("Web server is running!");
	},
});

console.log(`Web server running on port ${server.port}`);
