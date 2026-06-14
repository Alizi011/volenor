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

  const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
  const token = cookies[Session.cookieName];

  if (!token) {
    return ctx;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return ctx;
  }

  const user = await findUserById(session.userId);

  if (user) {
    ctx.user = user;
  }

  return ctx;
}