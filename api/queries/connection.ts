import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const pool = createPool(env.databaseUrl);

    instance = drizzle(pool, {
      mode: "default",
      schema: fullSchema,
    });
  }

  return instance;
}