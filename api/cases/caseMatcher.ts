import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function findMatchingCase(analysis: any) {
  const caseReference = analysis.caseReference;

  if (!caseReference) {
    return null;
  }

  const result: any = await getDb().execute(sql`
    SELECT *
    FROM cases
    WHERE externalReference = ${caseReference}
    ORDER BY id DESC
    LIMIT 1
  `);

  const rows = normalizeRows(result);

  return rows[0] ?? null;
}