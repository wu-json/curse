#!/usr/bin/env node

console.log('[QUEUE] Starting job queue worker...');

let processedJobs = 0;
let failedJobs = 0;
let pendingJobs = 12;

const jobTypes = [
  'email.send',
  'image.resize',
  'pdf.generate',
  'user.notify',
  'data.export',
  'file.upload',
  'webhook.deliver',
  'report.generate',
];

const errors = [
  'Connection timeout',
  'Invalid payload',
  'Rate limit exceeded',
  'External service unavailable',
  'Insufficient permissions',
];

function simulateJobProcessing() {
  if (Math.random() > 0.4 && pendingJobs > 0) {
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const jobId = Math.random().toString(36).substring(2, 8);
    const processingTime = (Math.random() * 3 + 0.5).toFixed(2);

    console.log(`[QUEUE] Processing job ${jobId} (${jobType})...`);

    setTimeout(() => {
      if (Math.random() > 0.85) {
        const error = errors[Math.floor(Math.random() * errors.length)];
        failedJobs++;
        pendingJobs = Math.max(0, pendingJobs - 1);
        console.log(`[QUEUE] Job ${jobId} FAILED: ${error}`);
      } else {
        processedJobs++;
        pendingJobs = Math.max(0, pendingJobs - 1);
        console.log(`[QUEUE] Job ${jobId} completed in ${processingTime}s`);
      }
    }, parseFloat(processingTime) * 1000);
  }

  if (Math.random() > 0.7) {
    const newJobs = Math.floor(Math.random() * 3) + 1;
    pendingJobs += newJobs;
    console.log(`[QUEUE] ${newJobs} new job(s) queued (${pendingJobs} pending)`);
  }

  if (Math.random() > 0.9) {
    console.log(`[QUEUE] Stats: ${processedJobs} completed, ${failedJobs} failed, ${pendingJobs} pending`);
  }
}

console.log('[QUEUE] Connected to job queue');
console.log('[QUEUE] Worker ready with 4 concurrent slots');
console.log(`[QUEUE] Stats: 0 completed, 0 failed, ${pendingJobs} pending`);

setInterval(simulateJobProcessing, 1200 + Math.random() * 1800);

process.on('SIGTERM', () => {
  console.log('[QUEUE] Received SIGTERM, finishing current jobs...');
  console.log('[QUEUE] Queue worker stopped');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[QUEUE] Received SIGINT, finishing current jobs...');
  console.log('[QUEUE] Queue worker stopped');
  process.exit(0);
});