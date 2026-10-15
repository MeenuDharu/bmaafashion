#!/usr/bin/env tsx

import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Database Cleanup Script
 *
 * This script cleans up all data from all tables in the database.
 * It deletes data in the proper order to respect foreign key constraints.
 *
 * Usage: npx tsx scripts/clean-database.ts
 */

// Tables in deletion order (child tables first, then parent tables)
// This order respects foreign key constraints without needing special permissions
const TABLES_IN_DELETE_ORDER = [
  // Child tables with foreign keys first
  "review_helpful_votes",
  "product_reviews",
  "order_items",
  "order_status_history",
  "cart_items",
  "inventory_history",
  "stock_alerts",
  "wishlists",
  "categories",
  "user_addresses",
  "password_reset_tokens",
  "email_verification_tokens",
  "email_preferences",
  "email_rate_limits",
  "sms_preferences",
  "sms_rate_limits",
  "sms_delivery_logs",
  "whatsapp_preferences",
  "whatsapp_rate_limits",
  "whatsapp_delivery_logs",
  "user_preferences",
  "customer_communication_history",
  "customer_profile_audit_log",
  "customer_analytics_cache",
  "customer_notes",
  "notification_history",
  "email_queue",
  "sms_queue",
  "whatsapp_queue",
  "notifications",
  "support_tickets",
  "bulk_operations",
  "message_templates",
  "recipient_groups",

  // Parent tables last
  "orders",
  "products",
  "users",
  "sessions",
];

async function cleanDatabase() {
  try {
    console.log("🧹 Starting database cleanup...");

    // Get all table names from the database to verify they exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const existingTables = new Set(
      (result.rows as any[]).map((row) => row.table_name),
    );
    const tablesToClean = TABLES_IN_DELETE_ORDER.filter((table) =>
      existingTables.has(table),
    );

    console.log(`📊 Found ${existingTables.size} tables in database`);
    console.log(`🎯 Will clean ${tablesToClean.length} application tables`);

    if (tablesToClean.length === 0) {
      console.log("ℹ️  No tables to clean");
      return;
    }

    // Clean tables in proper order (no special permissions needed)
    console.log("🗑️  Cleaning tables in dependency order...");
    let cleanedCount = 0;

    for (const tableName of tablesToClean) {
      try {
        console.log(`   Cleaning table: ${tableName}`);
        await db.execute(sql.raw(`DELETE FROM "${tableName}"`));
        cleanedCount++;
      } catch (error) {
        console.error(
          `   ❌ Failed to clean table ${tableName}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log(`✅ Database cleanup completed successfully!`);
    console.log(`📈 Summary:`);
    console.log(`   - Tables found: ${existingTables.size}`);
    console.log(`   - Tables cleaned: ${cleanedCount}/${tablesToClean.length}`);

    if (cleanedCount < tablesToClean.length) {
      console.log(
        `⚠️  Some tables could not be cleaned. Check the errors above.`,
      );
    }
  } catch (error) {
    console.error(
      "❌ Database cleanup failed:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

// Handle script execution
async function main() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set");
      process.exit(1);
    }

    console.log("🚀 Bmaa Fashion Database Cleanup Script");
    console.log("=======================================");

    // Confirm with user in interactive mode
    if (process.stdout.isTTY) {
      console.log(
        "⚠️  WARNING: This will permanently delete ALL data from the database!",
      );
      console.log("   This action cannot be undone.");
      console.log("");
      console.log(
        "   To proceed, run: npx tsx scripts/clean-database.ts --confirm",
      );

      if (!process.argv.includes("--confirm")) {
        console.log("🛑 Operation cancelled. Use --confirm flag to proceed.");
        process.exit(0);
      }
    }

    await cleanDatabase();
  } catch (error) {
    console.error(
      "💥 Script execution failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script if executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanDatabase };
