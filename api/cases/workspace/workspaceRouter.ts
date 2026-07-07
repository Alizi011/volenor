import { z } from "zod";

import { createRouter, authedQuery } from "../../middleware";

import { getCaseWorkspace } from "./caseWorkspaceService";

export const workspaceRouter = createRouter({

  get: authedQuery

    .input(
      z.object({
        caseId: z.number(),
      }),
    )

    .query(async ({ input }) => {

      return getCaseWorkspace(input.caseId);

    }),

});