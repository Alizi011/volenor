import * as cookie from "cookie";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./auth/session";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
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
    ctx.user = user;
  }

  return ctx;
}