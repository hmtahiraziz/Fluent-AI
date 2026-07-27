import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let dbInstance: Database | null = null;

export function initDb(connectionString: string): Database {
  dbInstance = drizzle(neon(connectionString), { schema });
  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return dbInstance;
}
