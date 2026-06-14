import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
// 1. ENDRET: Lagt til publicProcedure her (eller bruk publicMutation hvis det er det filen din eksporterer)
import { createRouter, authedQuery, publicQuery, publicProcedure } from "./middleware";
import { getDb } from "./queries/connection";
import { createUser, findUserByEmail, updateLastSignIn } from "./queries/users";
import { signSessionToken } from "./auth/session";
import {
  households,
  plans,
  subscriptions,
  userSettings,
} from "@db/schema";

function setSessionCookie(headers: Headers, req: Request, token: string) {
  const opts = getSessionCookieOptions(req.headers);

  headers.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  // 2. ENDRET: Byttet fra publicQuery til publicProcedure siden dette er en mutasjon (.mutation)
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await findUserByEmail(input.email);

      if (existing) {
        throw new Error("E-postadressen er allerede registrert.");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const userResult = await createUser({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.email === "admin@perun.no" ? "admin" : "user",
        status: "active",
      });

      if (!userResult?.id) {
        throw new Error("Kunne ikke opprette bruker.");
      }

      const userId = userResult.id;
      const db = getDb();

      const [householdResult] = await db
        .insert(households)
        .values({
          ownerUserId: userId,
          name: `${input.name} sin husholdning`,
          status: "active",
          maxFamilyMembers: 4,
        })
        .$returningId();

      const householdId = householdResult.id;

      const [planResult] = await db
        .insert(plans)
        .values({
          name: "Familie",
          priceMonthly: 9900,
          includedUsers: 1,
          includedFamilyMembers: 4,
          isActive: 1,
        })
        .$returningId();

      await db.insert(subscriptions).values({
        householdId,
        planId: planResult.id,
        status: input.email === "admin@perun.no" ? "manual_free" : "inactive",
        grantedByAdmin: input.email === "admin@perun.no" ? 1 : 0,
      });

      await db.insert(userSettings).values({
        userId,
        theme: "dark",
        language: "nb",
      });

      const token = await signSessionToken({ userId });

      setSessionCookie(ctx.resHeaders, ctx.req, token);

      return {
        success: true,
        user: {
          id: userId,
          name: input.name,
          email: input.email,
          role: input.email === "admin@perun.no" ? "admin" : "user",
        },
      };
    }),

  // 3. ENDRET: Byttet fra publicQuery til publicProcedure slik at nettverkskallet sendes som POST
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await findUserByEmail(input.email);

      if (!user) {
        throw new Error("Feil e-post eller passord.");
      }

      if (user.status !== "active") {
        throw new Error("Brukeren er ikke aktiv.");
      }

      const validPassword = await bcrypt.compare(
        input.password,
        user.passwordHash,
      );

      if (!validPassword) {
        throw new Error("Feil e-post eller passord.");
      }

      await updateLastSignIn(user.id);

      const token = await signSessionToken({ userId: user.id });

      setSessionCookie(ctx.resHeaders, ctx.req, token);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);

    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );

    return { success: true };
  }),
});