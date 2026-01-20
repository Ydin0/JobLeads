import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Check if we're connecting to a local database or Neon
const isLocalDb = process.env.DATABASE_URL.includes("localhost") || 
                  process.env.DATABASE_URL.includes("127.0.0.1");

// Use node-postgres for local, neon-http for cloud
export const db = isLocalDb
  ? drizzlePg(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
  : drizzleNeon(neon(process.env.DATABASE_URL), { schema });

export * from "./schema";
