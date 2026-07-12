import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { createEvent } from "./caseEventService";

interface AddCaseNoteInput {
  caseId: number;
  note: string;
  createdByUserId?: number | null;
}

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function addCaseNote(input: AddCaseNoteInput) {
  const db = getDb();
  const note = input.note.trim();

  if (!note) {
    throw new Error("Notatet kan ikke være tomt.");
  }

  const caseResult: any = await db.execute(sql`
    SELECT id
    FROM cases
    WHERE id = ${input.caseId}
    LIMIT 1
  `);

  const currentCase = normalizeRows(caseResult)[0];

  if (!currentCase) {
    throw new Error("Saken finnes ikke.");
  }

  const insertResult: any = await db.execute(sql`
    INSERT INTO case_notes
    (
      caseId,
      note,
      createdByUserId
    )
    VALUES
    (
      ${input.caseId},
      ${note},
      ${input.createdByUserId ?? null}
    )
  `);

  const noteId =
    insertResult?.[0]?.insertId ??
    insertResult?.insertId ??
    null;

  await db.execute(sql`
    UPDATE cases
    SET lastActivityAt = CURRENT_TIMESTAMP
    WHERE id = ${input.caseId}
  `);

  await createEvent({
    caseId: input.caseId,
    eventType: "note_added",
    title: "Notat lagt til",
    description: note,
    source: "manual",
    createdByUserId: input.createdByUserId ?? null,
  });

  return {
    success: true,
    id: noteId ? Number(noteId) : null,
    caseId: input.caseId,
    note,
  };
}