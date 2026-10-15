import dotenv from "dotenv";
dotenv.config();
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";

import pg from "pg";
const { Pool: PgPool } = pg;

import * as schema from "@shared/schema";

const isReplit = !!process.env.REPL_ID;

// console.log("isReplit", isReplit);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let pool: any;
let db: ReturnType<typeof drizzleNeon>;

if (isReplit) {
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
} else {
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon(pool, { schema });
}

export { db, pool };
