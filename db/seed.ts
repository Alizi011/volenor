import { getDb } from "../api/queries/connection";
import {
  users,
  households,
  plans,
  subscriptions,
  documents,
  tasks,
  inboxItems,
  financeEntries,
  budgets,
  debtCases,
  debtNotes,
  communications,
  familyMembers,
  customCategories,
  userSettings,
} from "./schema";

const db = getDb();

async function seed() {
  console.log("Seeding database...");

  const [userResult] = await db.insert(users).values({
    name: "Admin",
    email: "admin@perun.no",
    passwordHash: "temporary-password-hash",
    role: "admin",
    status: "active",
  }).$returningId();

  const userId = userResult.id;

  const [householdResult] = await db.insert(households).values({
    ownerUserId: userId,
    name: "Min husholdning",
    status: "active",
    maxFamilyMembers: 4,
  }).$returningId();

  const householdId = householdResult.id;

  const [planResult] = await db.insert(plans).values({
    name: "Familie",
    priceMonthly: 9900,
    includedUsers: 1,
    includedFamilyMembers: 4,
    isActive: 1,
  }).$returningId();

  const planId = planResult.id;

  await db.insert(subscriptions).values({
    householdId,
    planId,
    status: "manual_free",
    grantedByAdmin: 1,
  });

  const [famMe] = await db.insert(familyMembers).values({
    householdId,
    name: "Deg selv",
    relation: "Meg",
    color: "#7aa8ff",
    notes: "Hovedbruker",
    dateOfBirth: "1988-03-15",
  }).$returningId();

  await db.insert(familyMembers).values([
    {
      householdId,
      name: "Kari",
      relation: "Ektefelle",
      color: "#f472b6",
      notes: "",
      dateOfBirth: "1990-07-22",
    },
    {
      householdId,
      name: "Ola",
      relation: "Sønn",
      color: "#4ade80",
      notes: "",
      dateOfBirth: "2015-11-03",
    },
    {
      householdId,
      name: "Ingrid",
      relation: "Datter",
      color: "#c084fc",
      notes: "",
      dateOfBirth: "2018-05-19",
    },
  ]);

  console.log("  Family members seeded");

  const familyMemberId = famMe.id;

  const docsData = [
    { name: "2024-01-15_Faktura_Strøm.pdf", category: "invoices", date: "2024-01-15", size: 245760, type: "pdf" as const, tags: JSON.stringify(["strøm", "månedlig"]), notes: "Strømregning for januar 2024" },
    { name: "2024-01-10_Bank_Kontoutskrift.pdf", category: "bank", date: "2024-01-10", size: 512000, type: "pdf" as const, tags: JSON.stringify(["bank"]), notes: "Desember kontoutskrift" },
    { name: "2024-01-08_ID_Pass.pdf", category: "id", date: "2024-01-08", size: 1048576, type: "pdf" as const, tags: JSON.stringify(["pass", "reise"]), notes: "Kopi av pass" },
  ];

  for (const d of docsData) {
    await db.insert(documents).values({ ...d, householdId, familyMemberId });
  }

  console.log("  Documents seeded");

  const tasksData = [
    { title: "Betale strømregning", category: "invoice" as const, dueDate: "2024-02-01", priority: "high" as const, status: "new" as const, tags: JSON.stringify(["strøm"]), notes: "Beløp: 1 245 kr" },
    { title: "Signere leiekontrakt", category: "signature" as const, dueDate: "2024-02-15", priority: "high" as const, status: "new" as const, tags: JSON.stringify(["kontrakt"]), notes: "Må signeres og returneres" },
  ];

  for (const t of tasksData) {
    await db.insert(tasks).values({ ...t, householdId, familyMemberId });
  }

  console.log("  Tasks seeded");

  const inboxData = [
    { name: "2024-01-28_Faktura_Mobil.pdf", date: "2024-01-28", size: 145000, type: "pdf" as const },
    { name: "2024-01-25_Kvittering_Butikk.pdf", date: "2024-01-25", size: 89000, type: "pdf" as const },
  ];

  for (const i of inboxData) {
    await db.insert(inboxItems).values({ ...i, householdId, familyMemberId });
  }

  console.log("  Inbox seeded");

  const finData = [
    { title: "Strømregning", amount: 124500, type: "expense" as const, category: "invoices", date: "2024-01-15", status: "pending" as const, notes: "Januar strøm", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Lønn", amount: 4500000, type: "income" as const, category: "income", date: "2024-01-25", status: "paid" as const, notes: "Månedslønn", isRecurring: 1, recurringInterval: "monthly" },
  ];

  for (const f of finData) {
    await db.insert(financeEntries).values({ ...f, householdId, familyMemberId });
  }

  console.log("  Finances seeded");

  await db.insert(budgets).values([
    { householdId, category: "invoices", monthlyLimit: 600000 },
    { householdId, category: "expense", monthlyLimit: 1000000 },
  ]);

  console.log("  Budgets seeded");

  const [dc1] = await db.insert(debtCases).values({
    householdId,
    familyMemberId,
    title: "Kredittkortgjeld",
    creditor: "Sbanken",
    originalAmount: 8750000,
    currentAmount: 6200000,
    status: "payment_plan",
    priority: "critical",
    documentIds: JSON.stringify([]),
    interestRate: 12,
    dueDate: null,
    referenceNumber: "SB-8847-2211",
  }).$returningId();

  const debtCaseId = dc1.id;

  await db.insert(debtNotes).values([
    { debtCaseId, content: "Ringte kreditor 15.01. Avtalt nedbetaling på 5 000 kr/mnd." },
    { debtCaseId, content: "Fikk bekreftelse på e-post. Rente redusert fra 18% til 12%." },
  ]);

  await db.insert(communications).values([
    {
      debtCaseId,
      type: "phone",
      direction: "sent",
      date: "2024-01-15T10:30:00",
      description: "Ringte kundeservice og avtalte nedbetalingsplan.",
    },
  ]);

  console.log("  Debt cases seeded");

  await db.insert(customCategories).values([
    {
      householdId,
      familyMemberId,
      label: "Inkasso",
      icon: "file-warning",
      color: "#ef4444",
    },
  ]);

  await db.insert(userSettings).values({
    userId,
    theme: "dark",
    language: "nb",
  });

  console.log("  Settings seeded");
  console.log("\n✓ Seed complete!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});