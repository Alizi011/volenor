import { authRouter } from "./auth-router";
import { synapseRouter, adminRouter } from "./synapse-router";
import { createRouter } from "./middleware";

export const appRouter = createRouter({
  auth: authRouter,
  synapse: synapseRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
