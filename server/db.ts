import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

export let db: ReturnType<typeof drizzle> | undefined;
export const DB_ENABLED = !!process.env.DATABASE_URL && !/HOST\.neon\.tech/i.test(process.env.DATABASE_URL);

if (DB_ENABLED && process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}
