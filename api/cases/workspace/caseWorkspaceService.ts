import { sql } from "drizzle-orm";
import { getDb } from "../../queries/connection";

import type { CaseWorkspace } from "./types";

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function getCaseWorkspace(
  caseId: number
): Promise<CaseWorkspace> {

  const db = getDb();

  const caseResult: any = await db.execute(sql`
    SELECT *
    FROM cases
    WHERE id = ${caseId}
    LIMIT 1
  `);

  const currentCase =
    normalizeRows(caseResult)[0] ?? null;

  if (!currentCase) {
    throw new Error("Saken finnes ikke.");
  }

const eventsResult: any = await db.execute(sql`
  SELECT *
  FROM case_events
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const events = normalizeRows(eventsResult);

const documentsResult: any = await db.execute(sql`
  SELECT *
  FROM inbox_documents
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const documents = normalizeRows(documentsResult);

const financeResult: any = await db.execute(sql`
  SELECT *
  FROM financial_items
  WHERE debtCaseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const finance = normalizeRows(financeResult);

const notesResult: any = await db.execute(sql`
  SELECT *
  FROM case_notes
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const notes = normalizeRows(notesResult);

const partiesResult: any = await db.execute(sql`
  SELECT *
  FROM case_parties
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const parties = normalizeRows(partiesResult);

const communicationsResult: any = await db.execute(sql`
  SELECT *
  FROM case_communications
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const communications = normalizeRows(communicationsResult);

const journalResult: any = await db.execute(sql`
  SELECT *
  FROM case_journal
  WHERE caseId = ${caseId}
  ORDER BY createdAt DESC, id DESC
`);

const journal = normalizeRows(journalResult);

return {

  case: currentCase,

  documents,

  events,

  finance,
  
  notes,

  parties,

  communications: [],

  journal,

  aiSummary: currentCase.summary ?? null,

 statistics: {
  documentCount: documents.length,
  eventCount: events.length,
  financeCount: finance.length,
  noteCount: notes.length,
  partyCount: parties.length,
  communicationCount: communications.length,
  journalCount: journal.length,
},
};
}