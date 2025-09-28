#!/usr/bin/env bun

console.log("[SEED-DATA] Starting data seeding process...");
console.log("[SEED-DATA] Connecting to database...");

// Simulate connection time
await new Promise((resolve) => setTimeout(resolve, 1500));

console.log("[SEED-DATA] Connection established");
console.log("[SEED-DATA] Checking if seed data already exists...");

await new Promise((resolve) => setTimeout(resolve, 800));

const seedSets = [
	{ name: "admin_users", count: 3 },
	{ name: "default_roles", count: 5 },
	{ name: "system_settings", count: 12 },
	{ name: "sample_products", count: 25 },
	{ name: "demo_customers", count: 50 },
];

console.log("[SEED-DATA] Database is empty, proceeding with seeding...");

for (const seedSet of seedSets) {
	console.log(`[SEED-DATA] Seeding ${seedSet.name}...`);

	// Simulate seeding time proportional to count
	const duration = seedSet.count * 50 + Math.random() * 1000;

	// Show progress for larger sets
	if (seedSet.count > 10) {
		const steps = Math.ceil(seedSet.count / 10);
		for (let i = 0; i < steps; i++) {
			await new Promise((resolve) => setTimeout(resolve, duration / steps));
			const progress = Math.min(100, ((i + 1) / steps) * 100);
			console.log(
				`[SEED-DATA] ${seedSet.name}: ${progress.toFixed(0)}% (${Math.min((i + 1) * 10, seedSet.count)}/${seedSet.count})`,
			);
		}
	} else {
		await new Promise((resolve) => setTimeout(resolve, duration));
	}

	console.log(
		`[SEED-DATA] ✓ ${seedSet.name} completed (${seedSet.count} records)`,
	);
}

console.log("[SEED-DATA] Creating indexes for seeded data...");
await new Promise((resolve) => setTimeout(resolve, 2000));

console.log("[SEED-DATA] Data seeding completed successfully");
console.log("[SEED-DATA] Total records created: 95");
console.log("[SEED-DATA] Seed process finished");

process.exit(0);
