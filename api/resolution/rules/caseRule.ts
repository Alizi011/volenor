import { findMatchingCase } from "../../cases/caseMatcher";
import {
  ResolutionContext,
  ResolutionRule,
} from "./types";

export const caseRule: ResolutionRule = {
  name: "Case Rule",

  async execute(
    context: ResolutionContext
  ) {
    const existingCase = await findMatchingCase(
      context.analysis
    );

    if (!existingCase) {
      return null;
    }

    return {
      action: "update_case",
      caseId: Number(existingCase.id),
      reason:
        "Fant eksisterende sak med samme saksreferanse.",
      confidence: 100,
    };
  },
};