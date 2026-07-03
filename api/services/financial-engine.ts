import { eq, desc } from "drizzle-orm";
import { getDb } from "../queries/connection";
import {
  financialItems,
  financialEvents,
} from "@db/schema";

const db = () => getDb();

type CreateFinancialItemInput = {
  householdId: number;
  familyMemberId?: number | null;
  documentId?: number | null;
  financeEntryId?: number | null;
  debtCaseId?: number | null;

  title: string;
  type?: "invoice" | "reminder" | "debt_collection" | "bailiff" | "loan" | "subscription" | "insurance" | "tax" | "other";
  status?: "draft" | "pending_approval" | "active" | "unpaid" | "overdue" | "reminder" | "collection_notice" | "debt_collection" | "bailiff" | "payment_plan" | "paid" | "closed" | "disputed" | "archived";

  creditorName?: string | null;
  collectorName?: string | null;

  originalAmount?: number | string | null;
  currentAmount?: number | string | null;

  currency?: string;
  invoiceNumber?: string | null;
  kidNumber?: string | null;
  accountNumber?: string | null;
  referenceNumber?: string | null;
  category?: string | null;

  issueDate?: string | null;
  dueDate?: string | null;
  paidDate?: string | null;

  notes?: string | null;
};

type AddEventInput = {
  householdId: number;
  financialItemId: number;
  documentId?: number | null;
  financeEntryId?: number | null;
  debtCaseId?: number | null;
  eventType:
    | "document_received"
    | "ai_analyzed"
    | "user_approved"
    | "invoice_created"
    | "due_date"
    | "reminder_created"
    | "overdue"
    | "reminder_received"
    | "collection_notice_received"
    | "debt_collection_created"
    | "bailiff_notice_received"
    | "payment_registered"
    | "fee_added"
    | "interest_added"
    | "note_added"
    | "status_changed"
    | "closed";
  title: string;
  description?: string | null;
  amountChange?: number | string | null;
  eventDate?: string;
};

export const financialEngine = {
  async createFinancialItem(input: CreateFinancialItemInput) {
    const result = await db()
      .insert(financialItems)
      .values({
        householdId: input.householdId,
        familyMemberId: input.familyMemberId ?? null,
        documentId: input.documentId ?? null,
        financeEntryId: input.financeEntryId ?? null,
        debtCaseId: input.debtCaseId ?? null,

        title: input.title,
        type: input.type ?? "invoice",
        status: input.status ?? "pending_approval",

        creditorName: input.creditorName ?? null,
        collectorName: input.collectorName ?? null,

        originalAmount: input.originalAmount ?? null,
        currentAmount: input.currentAmount ?? input.originalAmount ?? null,

        currency: input.currency ?? "NOK",

        invoiceNumber: input.invoiceNumber ?? null,
        kidNumber: input.kidNumber ?? null,
        accountNumber: input.accountNumber ?? null,
        referenceNumber: input.referenceNumber ?? null,
        category: input.category ?? null,

        issueDate: input.issueDate ?? null,
        dueDate: input.dueDate ?? null,
        paidDate: input.paidDate ?? null,

        notes: input.notes ?? null,
      } as any);

    const financialItemId = Number(result[0].insertId);

    await this.addEvent({
      householdId: input.householdId,
      financialItemId,
      documentId: input.documentId ?? null,
      financeEntryId: input.financeEntryId ?? null,
      debtCaseId: input.debtCaseId ?? null,
      eventType: "invoice_created",
      title: "Økonomisk sak opprettet",
      description: input.title,
      amountChange: input.originalAmount ?? null,
      eventDate: new Date().toISOString().slice(0, 10),
    });

    return { id: financialItemId };
  },

  async addEvent(input: AddEventInput) {
    const result = await db()
      .insert(financialEvents)
      .values({
        householdId: input.householdId,
        financialItemId: input.financialItemId,
        documentId: input.documentId ?? null,
        financeEntryId: input.financeEntryId ?? null,
        debtCaseId: input.debtCaseId ?? null,
        eventType: input.eventType,
        title: input.title,
        description: input.description ?? null,
        amountChange: input.amountChange ?? null,
        eventDate: input.eventDate ?? new Date().toISOString().slice(0, 10),
      } as any);

    return { id: Number(result[0].insertId) };
  },

  async updateStatus(
    householdId: number,
    financialItemId: number,
    status: CreateFinancialItemInput["status"],
    title = "Status endret",
  ) {
    await db()
      .update(financialItems)
      .set({ status } as any)
      .where(eq(financialItems.id, financialItemId));

    await this.addEvent({
      householdId,
      financialItemId,
      eventType: "status_changed",
      title,
      description: `Ny status: ${status}`,
    });

    return { success: true };
  },

  async markAsPaid(
    householdId: number,
    financialItemId: number,
    amount?: number | string | null,
  ) {
    const paidDate = new Date().toISOString().slice(0, 10);

    await db()
      .update(financialItems)
      .set({
        status: "paid",
        paidDate,
      } as any)
      .where(eq(financialItems.id, financialItemId));

    await this.addEvent({
      householdId,
      financialItemId,
      eventType: "payment_registered",
      title: "Betaling registrert",
      amountChange: amount ? `-${amount}` : null,
      eventDate: paidDate,
    });

    return { success: true };
  },

  async listFinancialItems(householdId: number) {
    return db()
      .select()
      .from(financialItems)
      .where(eq(financialItems.householdId, householdId))
      .orderBy(desc(financialItems.createdAt));
  },

  async listEvents(financialItemId: number) {
    return db()
      .select()
      .from(financialEvents)
      .where(eq(financialEvents.financialItemId, financialItemId))
      .orderBy(desc(financialEvents.createdAt));
  },
};