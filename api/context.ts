import * as cookie from "cookie";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./auth/session";
import { findUserById } from "./queries/users";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User & {
  householdId?: number | null;
  householdRole?: "owner" | "admin" | "member" | null;
  familyMemberId?: number | null;
};
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
  };

  const cookieHeader = opts.req.headers.get("cookie");
  const cookies = cookie.parse(cookieHeader || "");
  const token = cookies[Session.cookieName];

  console.log("COOKIE HEADER:", cookieHeader);
  console.log("SESSION COOKIE NAME:", Session.cookieName);
  console.log("TOKEN EXISTS:", !!token);

  if (!token) {
    return ctx;
  }

  const session = await verifySessionToken(token);

  console.log("SESSION:", session);

  if (!session) {
    return ctx;
  }

  const user = await findUserById(session.userId);

  console.log("USER FOUND:", !!user, user?.email);

if (user) {
  const householdUserResult: any = await getDb().execute(sql`
    SELECT householdId, role
    FROM household_users
    WHERE userId = ${user.id}
    LIMIT 1
  `);

  const householdUserRows = Array.isArray(householdUserResult)
    ? Array.isArray(householdUserResult[0])
      ? householdUserResult[0]
      : householdUserResult
    : [];

  const householdUser = householdUserRows[0];

  const familyMemberResult: any = await getDb().execute(sql`
    SELECT id
    FROM family_members
    WHERE userId = ${user.id}
    LIMIT 1
  `);

  const familyMemberRows = Array.isArray(familyMemberResult)
    ? Array.isArray(familyMemberResult[0])
      ? familyMemberResult[0]
      : familyMemberResult
    : [];

  const familyMember = familyMemberRows[0];

  ctx.user = {
    ...user,
    householdId: householdUser?.householdId ?? null,
    householdRole: householdUser?.role ?? null,
    familyMemberId: familyMember?.id ?? null,
  };
}
console.log("CTX USER:", ctx.user);
  return ctx;
}