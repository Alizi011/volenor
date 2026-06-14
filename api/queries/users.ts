import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows.at(0);
}

export async function createUser(data: InsertUser) {
  const result = await getDb().insert(users).values(data).$returningId();

  return result.at(0);
}

export async function updateLastSignIn(userId: number) {
  await getDb()
    .update(users)
    .set({ lastSignInAt: new Date() })
    .where(eq(users.id, userId));
}