#!/usr/bin/env node

console.log('[CACHE] Starting Redis cache service...');

let cacheHits = 0;
let cacheMisses = 0;
let memoryUsage = 45;

const cacheOperations = [
  'user:session:abc123',
  'product:details:456',
  'auth:token:xyz789',
  'cart:items:user789',
  'config:feature:flags',
  'analytics:daily:stats',
];

const evictionReasons = [
  'TTL expired',
  'Memory pressure',
  'Manual delete',
  'Key overwritten',
];

function simulateCacheActivity() {
  if (Math.random() > 0.6) {
    const key = cacheOperations[Math.floor(Math.random() * cacheOperations.length)];

    if (Math.random() > 0.3) {
      cacheHits++;
      console.log(`[CACHE] HIT ${key} (${(Math.random() * 2 + 0.1).toFixed(2)}ms)`);
    } else {
      cacheMisses++;
      console.log(`[CACHE] MISS ${key}`);
    }
  }

  if (Math.random() > 0.85) {
    memoryUsage += (Math.random() - 0.5) * 10;
    memoryUsage = Math.max(20, Math.min(90, memoryUsage));
    console.log(`[CACHE] Memory usage: ${memoryUsage.toFixed(1)}% (${cacheHits + cacheMisses} total ops, ${((cacheHits / Math.max(1, cacheHits + cacheMisses)) * 100).toFixed(1)}% hit rate)`);
  }

  if (Math.random() > 0.95) {
    const key = cacheOperations[Math.floor(Math.random() * cacheOperations.length)];
    const reason = evictionReasons[Math.floor(Math.random() * evictionReasons.length)];
    console.log(`[CACHE] EVICTED ${key} (${reason})`);
  }
}

console.log('[CACHE] Redis server ready on port 6379');
console.log('[CACHE] Memory usage: 45.0% (0 total ops, 0.0% hit rate)');

setInterval(simulateCacheActivity, 800 + Math.random() * 1500);

process.on('SIGTERM', () => {
  console.log('[CACHE] Received SIGTERM, saving cache to disk...');
  console.log('[CACHE] Cache service stopped');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CACHE] Received SIGINT, saving cache to disk...');
  console.log('[CACHE] Cache service stopped');
  process.exit(0);
});