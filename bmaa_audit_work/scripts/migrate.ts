#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { pool } from "../server/db"

async function runMigrations() {
    const db = drizzle({ client: pool });

    console.log("🔄 Running migrations...");

    try {
        await migrate(db, { migrationsFolder: "./migrations" });
        console.log("✅ Migrations completed successfully");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();