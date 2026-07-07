import { sql } from "drizzle-orm";
import { getDb } from "../../queries/connection";

import { scoreReference } from "./scoreReference";
import { scoreCreditor } from "./scoreCreditor";
import { scoreAgency } from "./scoreAgency";
import { scoreBalance } from "./scoreBalance";

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export interface SimilarityResult {
  score: number;
  reasons: string[];
  matchedCase: any | null;
}

export async function findBestCaseMatch(
  analysis: any
): Promise<SimilarityResult> {

  const result: any = await getDb().execute(sql`
    SELECT *
    FROM cases
    WHERE status = 'active'
  `);

  const cases = normalizeRows(result);

  let bestCase = null;
  let bestScore = 0;
  let bestReasons: string[] = [];

  for (const c of cases) {

    let score = 0;
    const reasons: string[] = [];

    const referenceScore = scoreReference(
      analysis.caseReference,
      c.externalReference
    );

    if (referenceScore) {
      score += referenceScore;
      reasons.push("Samme saksreferanse");
    }

    const creditorScore = scoreCreditor(
      analysis.originalCreditor,
      c.originalCreditor
    );

    if (creditorScore) {
      score += creditorScore;
      reasons.push("Samme kreditor");
    }

    const agencyScore = scoreAgency(
      analysis.collectionAgency,
      c.collectionAgency
    );

    if (agencyScore) {
      score += agencyScore;
      reasons.push("Samme inkassobyrå");
    }

    const balanceScore = scoreBalance(
      analysis.currentBalance,
      c.currentBalance
    );

    if (balanceScore) {
      score += balanceScore;
      reasons.push("Lik saldo");
    }

    if (score > bestScore) {
      bestScore = score;
      bestCase = c;
      bestReasons = reasons;
    }
  }

  return {
    score: bestScore,
    reasons: bestReasons,
    matchedCase: bestCase,
  };
}