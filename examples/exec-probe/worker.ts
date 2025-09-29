// Background worker that creates a file when ready

import { writeFileSync } from "fs";

console.log("Worker starting...");
console.log("Performing initialization tasks...");

// Simulate longer initialization work (10 seconds)
setTimeout(() => {
  console.log("Step 1/3: Loading configuration...");
}, 2000);

setTimeout(() => {
  console.log("Step 2/3: Connecting to external services...");
}, 5000);

setTimeout(() => {
  console.log("Step 3/3: Finalizing setup...");
}, 8000);

setTimeout(() => {
  writeFileSync("/tmp/worker-ready", "ready");
  console.log("Worker is ready! Created readiness file at /tmp/worker-ready");

  // Keep the process running
  setInterval(() => {
    console.log("Worker processing...");
  }, 5000);
}, 10000); // 10 seconds before ready