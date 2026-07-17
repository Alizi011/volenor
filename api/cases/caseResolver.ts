import { createCase } from "./caseService";
import { resolveDocument } from "../resolution/resolutionEngine";
import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { createEvent } from "./caseEventService";

export async function processInboxDocument(
  inboxDocument: any,
  analysis: any
) {
  const decision = await resolveDocument(
    inboxDocument,
    analysis
  );

  const currentBalance =
    analysis.currentBalance ??
    analysis.amount ??
    null;

  const title =
    analysis.originalCreditor ??
    analysis.supplier ??
    inboxDocument.subject ??
    "Ny sak";

  /*
   * Dokumentet tilhører en eksisterende sak.
   */
  if (
    decision.action === "update_case" &&
    decision.caseId != null
  ) {
    const caseId = Number(decision.caseId);

    /*
     * Oppdater saken med ny informasjon.
     *
     * COALESCE brukes slik at eksisterende informasjon
     * ikke overskrives med NULL.
     */
    await getDb().execute(sql`
      UPDATE cases
      SET
        summary = COALESCE(
          ${analysis.summary ?? null},
          summary
        ),

        originalCreditor = COALESCE(
          ${analysis.originalCreditor ?? analysis.supplier ?? null},
          originalCreditor
        ),

        collectionAgency = COALESCE(
          ${analysis.collectionAgency ?? null},
          collectionAgency
        ),

        publicAuthority = COALESCE(
          ${analysis.publicAuthority ?? null},
          publicAuthority
        ),

        originalClaim = COALESCE(
          ${analysis.originalClaim ?? null},
          originalClaim
        ),

        interestAmount = COALESCE(
          ${analysis.interestAmount ?? null},
          interestAmount
        ),

        feeAmount = COALESCE(
          ${analysis.feeAmount ?? null},
          feeAmount
        ),

        collectionFee = COALESCE(
          ${analysis.collectionFee ?? null},
          collectionFee
        ),

        legalCost = COALESCE(
          ${analysis.legalCost ?? null},
          legalCost
        ),

        currentBalance = COALESCE(
          ${currentBalance},
          currentBalance
        ),

        deadline = COALESCE(
          ${analysis.deadline ?? analysis.dueDate ?? null},
          deadline
        ),

        externalReference = COALESCE(
          externalReference,
          ${analysis.caseReference ?? null}
        ),

        lastActivityAt = NOW()

      WHERE id = ${caseId}
    `);

    /*
     * Koble dokumentet til saken.
     */
    await getDb().execute(sql`
      UPDATE inbox_documents
      SET caseId = ${caseId}
      WHERE id = ${inboxDocument.id}
    `);

    /*
     * Opprett hendelse i sakens tidslinje.
     */
    await createEvent({
      caseId,
      inboxDocumentId: inboxDocument.id,
      eventType: "document_received",
      title: "Nytt dokument mottatt",
      description:
        analysis.summary ??
        "Dokument koblet til eksisterende sak.",
      amount: currentBalance,
      source: "ai",
      aiConfidence: decision.confidence,
      createdByUserId:
        inboxDocument.uploadedByUserId,
    });

    return {
      id: caseId,
      matched: true,
      action: decision.action,
      reason: decision.reason,
      confidence: decision.confidence,
    };
  }

  /*
   * Handlinger som ikke skal opprette en sak.
   */
  if (decision.action !== "create_case") {
    return {
      action: decision.action,
      reason: decision.reason,
      confidence: decision.confidence,
      matched: false,
    };
  }

  /*
   * Ingen eksisterende sak ble funnet.
   * Opprett en ny sak.
   */
  const newCase = await createCase({
    householdId: inboxDocument.householdId,

    title,

    type:
      analysis.caseType ??
      analysis.documentType ??
      "general",

    priority:
      analysis.priority ??
      "normal",

    summary:
      analysis.summary ??
      null,

    currentBalance,

    externalReference:
      analysis.caseReference ??
      null,

    originalCreditor:
      analysis.originalCreditor ??
      analysis.supplier ??
      null,

    collectionAgency:
      analysis.collectionAgency ??
      null,

    publicAuthority:
      analysis.publicAuthority ??
      null,

    originalClaim:
      analysis.originalClaim ??
      null,

    interestAmount:
      analysis.interestAmount ??
      null,

    feeAmount:
      analysis.feeAmount ??
      null,

    collectionFee:
      analysis.collectionFee ??
      null,

    legalCost:
      analysis.legalCost ??
      null,

    deadline:
      analysis.deadline ??
      analysis.dueDate ??
      null,

    createdByUserId:
      inboxDocument.uploadedByUserId,
  });

  /*
   * Koble dokumentet til den nye saken.
   */
  await getDb().execute(sql`
    UPDATE inbox_documents
    SET caseId = ${newCase.id}
    WHERE id = ${inboxDocument.id}
  `);

  /*
   * Opprett første tidslinjehendelse.
   */
  await createEvent({
    caseId: newCase.id,
    inboxDocumentId: inboxDocument.id,
    eventType: "case_created",
    title: "Sak opprettet",
    description:
      analysis.summary ??
      "Ny sak opprettet automatisk.",
    amount: currentBalance,
    source: "ai",
    aiConfidence: decision.confidence,
    createdByUserId:
      inboxDocument.uploadedByUserId,
  });

  return {
    ...newCase,
    matched: false,
    action: decision.action,
    reason: decision.reason,
    confidence: decision.confidence,
  };
}