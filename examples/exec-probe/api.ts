// API service that depends on both database and worker

import { serve } from "bun";

const server = serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/status") {
      return new Response(JSON.stringify({
        status: "healthy",
        database: "connected",
        worker: "ready"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("API is running!");
  },
});

console.log(`API server running on port ${server.port}`);