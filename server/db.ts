import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

export let db: ReturnType<typeof drizzle> | undefined;
export const DB_ENABLED = !!process.env.DATABASE_URL;

if (DB_ENABLED) {
  const url = process.env.DATABASE_URL as string;
  const sql = neon(url);
  db = drizzle(sql, { schema });
}
