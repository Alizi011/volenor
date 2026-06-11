import { getDb } from "../api/queries/connection";
import {
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

  // We need a user. For now, seed with userId = 1 (will be created on first auth)
  const userId = 1;

  // Family members
  const famMe = await db.insert(familyMembers).values({
    userId, name: "Deg selv", relation: "Meg", color: "#7aa8ff", notes: "Hovedbruker", dateOfBirth: "1988-03-15",
  });
  const famMeId = Number(famMe[0].insertId);
  
  const famKari = await db.insert(familyMembers).values({
    userId, name: "Kari", relation: "Ektefelle", color: "#f472b6", notes: "", dateOfBirth: "1990-07-22",
  });
  const famKariId = Number(famKari[0].insertId);

  const famOla = await db.insert(familyMembers).values({
    userId, name: "Ola", relation: "Sønn", color: "#4ade80", notes: "", dateOfBirth: "2015-11-03",
  });
  const famOlaId = Number(famOla[0].insertId);

  const famIngrid = await db.insert(familyMembers).values({
    userId, name: "Ingrid", relation: "Datter", color: "#c084fc", notes: "", dateOfBirth: "2018-05-19",
  });
  const famIngridId = Number(famIngrid[0].insertId);

  const famKare = await db.insert(familyMembers).values({
    userId, name: "Kåre", relation: "Far", color: "#fb923c", notes: "Bor på sykehjem", dateOfBirth: "1955-01-10",
  });
  const famKareId = Number(famKare[0].insertId);

  console.log("  Family members seeded");

  // Documents
  const docsData = [
    { name: "2024-01-15_Faktura_Strøm.pdf", category: "invoices", date: "2024-01-15", size: 245760, type: "pdf" as const, tags: JSON.stringify(["strøm", "månedlig"]), notes: "Strømregning for januar 2024" },
    { name: "2024-01-10_Bank_Kontoutskrift.pdf", category: "bank", date: "2024-01-10", size: 512000, type: "pdf" as const, tags: JSON.stringify(["bank"]), notes: "Desember kontoutskrift" },
    { name: "2024-01-08_ID_Pass.pdf", category: "id", date: "2024-01-08", size: 1048576, type: "pdf" as const, tags: JSON.stringify(["pass", "reise"]), notes: "Kopi av pass" },
    { name: "2023-12-15_Faktura_Forsikring.pdf", category: "invoices", date: "2023-12-15", size: 189440, type: "pdf" as const, tags: JSON.stringify(["forsikring"]), notes: "Årlig forsikringspremie" },
    { name: "2023-12-01_Vehicle_Bilservice.pdf", category: "vehicle", date: "2023-12-01", size: 420000, type: "pdf" as const, tags: JSON.stringify(["bil", "service"]), notes: "Service Toyota Corolla" },
    { name: "2023-11-28_Bank_Skatteoppgjør.pdf", category: "bank", date: "2023-11-28", size: 890000, type: "pdf" as const, tags: JSON.stringify(["skatt"]), notes: "Skatteoppgjør 2023" },
    { name: "2024-01-05_Bank_Lån.pdf", category: "bank", date: "2024-01-05", size: 680000, type: "pdf" as const, tags: JSON.stringify(["lån"]), notes: "Boliglånsdokumenter" },
    { name: "2024-01-20_Referanse_Garanti_TV.pdf", category: "receipts", date: "2024-01-20", size: 112000, type: "pdf" as const, tags: JSON.stringify(["garanti"]), notes: "Garantibevis Samsung TV" },
    { name: "2024-02-01_Faktura_Telefon.pdf", category: "invoices", date: "2024-02-01", size: 145000, type: "pdf" as const, tags: JSON.stringify(["telefon"]), notes: "Mobilregning januar" },
    { name: "2024-01-25_Bank_Kredittkort.pdf", category: "bank", date: "2024-01-25", size: 230000, type: "pdf" as const, tags: JSON.stringify(["kredittkort"]), notes: "Kredittkortregning" },
  ];
  for (const d of docsData) await db.insert(documents).values({ ...d, userId });
  console.log("  Documents seeded");

  // Tasks
  const tasksData = [
    { title: "Betale strømregning", category: "invoice" as const, dueDate: "2024-02-01", priority: "high" as const, status: "new" as const, tags: JSON.stringify(["strøm"]), notes: "Beløp: 1 245 kr" },
    { title: "Signere leiekontrakt", category: "signature" as const, dueDate: "2024-02-15", priority: "high" as const, status: "new" as const, tags: JSON.stringify(["kontrakt"]), notes: "Må signeres og returneres" },
    { title: "Skanne gamle kvitteringer", category: "scan" as const, dueDate: "2024-02-28", priority: "medium" as const, status: "in_progress" as const, tags: JSON.stringify(["kvittering"]), notes: "Kategorisere kvitteringer fra 2023" },
    { title: "Betale internetregning", category: "invoice" as const, dueDate: "2024-02-05", priority: "medium" as const, status: "new" as const, tags: JSON.stringify(["internet"]), notes: "Internetregning for januar" },
    { title: "Oppdatere forsikring", category: "other" as const, dueDate: "2024-03-01", priority: "medium" as const, status: "in_progress" as const, tags: JSON.stringify(["forsikring"]), notes: "Sammenligne tilbud" },
    { title: "Betale kredittkort", category: "invoice" as const, dueDate: "2024-02-10", priority: "high" as const, status: "new" as const, tags: JSON.stringify(["kredittkort"]), notes: "Kredittkortregning januar" },
    { title: "Skanne helsepapirer", category: "scan" as const, dueDate: "2024-03-15", priority: "low" as const, status: "done" as const, tags: JSON.stringify(["helse"]), notes: "Arkivere helserelaterte dokumenter" },
    { title: "Arkivere gamle prosjekter", category: "other" as const, dueDate: "2024-04-01", priority: "low" as const, status: "done" as const, tags: JSON.stringify(["arkiv"]), notes: "Rydde opp i gamle filer" },
    { title: "Sende bil til service", category: "other" as const, dueDate: "2024-03-20", priority: "medium" as const, status: "in_progress" as const, tags: JSON.stringify(["bil"]), notes: "Bestille time for bilservice" },
    { title: "Betale vannavgift", category: "invoice" as const, dueDate: "2024-02-15", priority: "medium" as const, status: "new" as const, tags: JSON.stringify(["vann"]), notes: "Vannavgift for februar" },
  ];
  for (const t of tasksData) await db.insert(tasks).values({ ...t, userId });
  console.log("  Tasks seeded");

  // Inbox
  const inboxData = [
    { name: "2024-01-28_Faktura_Mobil.pdf", date: "2024-01-28", size: 145000, type: "pdf" as const },
    { name: "2024-01-25_Kvittering_Butikk.pdf", date: "2024-01-25", size: 89000, type: "pdf" as const },
    { name: "2024-01-22_Dokument_Bank.pdf", date: "2024-01-22", size: 320000, type: "pdf" as const },
    { name: "2024-01-20_Notat_Lege.pdf", date: "2024-01-20", size: 167000, type: "pdf" as const },
    { name: "2024-01-18_Kontrakt_Bil.pdf", date: "2024-01-18", size: 450000, type: "pdf" as const },
  ];
  for (const i of inboxData) await db.insert(inboxItems).values({ ...i, userId });
  console.log("  Inbox seeded");

  // Finances
  const finData = [
    { title: "Strømregning", amount: 124500, type: "expense" as const, category: "invoices", date: "2024-01-15", status: "pending" as const, notes: "Januar strøm", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Forsikring", amount: 245000, type: "expense" as const, category: "invoices", date: "2024-01-05", status: "paid" as const, notes: "Årlig forsikringspremie", isRecurring: 1, recurringInterval: "yearly" },
    { title: "Internet", amount: 69900, type: "expense" as const, category: "invoices", date: "2024-01-10", status: "paid" as const, notes: "Fibernett", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Telefon", amount: 49900, type: "expense" as const, category: "invoices", date: "2024-02-01", status: "pending" as const, notes: "Mobilabonnement", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Lønn", amount: 4500000, type: "income" as const, category: "income", date: "2024-01-25", status: "paid" as const, notes: "Månedslønn", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Bilservice", amount: 350000, type: "expense" as const, category: "vehicle", date: "2024-01-20", status: "paid" as const, notes: "Årlig service", isRecurring: 1, recurringInterval: "yearly" },
    { title: "Kredittkort", amount: 875000, type: "expense" as const, category: "invoices", date: "2024-01-25", status: "pending" as const, notes: "Desember forbruk", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Leieinntekt", amount: 1200000, type: "income" as const, category: "income", date: "2024-01-01", status: "paid" as const, notes: "Utleie av hybel", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Matvarer", amount: 520000, type: "expense" as const, category: "expense", date: "2024-01-28", status: "paid" as const, notes: "Månedlig matbudsjett", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Streaming", amount: 31900, type: "expense" as const, category: "expense", date: "2024-01-05", status: "paid" as const, notes: "Netflix, Spotify", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Transport", amount: 180000, type: "expense" as const, category: "expense", date: "2024-01-30", status: "paid" as const, notes: "Buss, tog, drivstoff", isRecurring: 1, recurringInterval: "monthly" },
    { title: "Vannavgift", amount: 58000, type: "expense" as const, category: "invoices", date: "2024-01-15", status: "pending" as const, notes: "Kvartalsvis", isRecurring: 1, recurringInterval: "quarterly" },
  ];
  for (const f of finData) await db.insert(financeEntries).values({ ...f, userId });
  console.log("  Finances seeded");

  // Budgets
  const budData = [
    { category: "invoices", monthlyLimit: 600000 },
    { category: "vehicle", monthlyLimit: 300000 },
    { category: "expense", monthlyLimit: 1000000 },
  ];
  for (const b of budData) await db.insert(budgets).values({ ...b, userId });
  console.log("  Budgets seeded");

  // Debt cases
  const dc1 = await db.insert(debtCases).values({
    userId, title: "Kredittkortgjeld", creditor: "Sbanken", originalAmount: 8750000, currentAmount: 6200000,
    status: "payment_plan", priority: "critical", memberId: null, documentIds: JSON.stringify([]),
    interestRate: 12, dueDate: null, referenceNumber: "SB-8847-2211",
  });
  const dc1Id = Number(dc1[0].insertId);

  const dc2 = await db.insert(debtCases).values({
    userId, title: "Inkasso - Strømregning", creditor: "Hafslund Inkasso", originalAmount: 124500, currentAmount: 142300,
    status: "open", priority: "high", memberId: null, documentIds: JSON.stringify([]),
    interestRate: 8, dueDate: "2024-02-03", referenceNumber: "INK-2024-004412",
  });
  const dc2Id = Number(dc2[0].insertId);

  const dc3 = await db.insert(debtCases).values({
    userId, title: "Forbrukslån", creditor: "Santander", originalAmount: 15000000, currentAmount: 9800000,
    status: "negotiating", priority: "high", memberId: null, documentIds: JSON.stringify([]),
    interestRate: 10, dueDate: null, referenceNumber: "SAN-LOAN-9921",
  });
  const dc3Id = Number(dc3[0].insertId);

  const dc4 = await db.insert(debtCases).values({
    userId, title: "Studielån (Lånekassen)", creditor: "Lånekassen", originalAmount: 38000000, currentAmount: 21000000,
    status: "payment_plan", priority: "medium", memberId: null, documentIds: JSON.stringify([]),
    interestRate: 6, dueDate: null, referenceNumber: "LK-4455-88-1234",
  });
  const dc4Id = Number(dc4[0].insertId);

  const dc5 = await db.insert(debtCases).values({
    userId, title: "Bilfinansiering", creditor: "Danske Bank", originalAmount: 28000000, currentAmount: 12500000,
    status: "payment_plan", priority: "medium", memberId: null, documentIds: JSON.stringify([]),
    interestRate: 4, dueDate: null, referenceNumber: "DB-AUTO-7788",
  });
  const dc5Id = Number(dc5[0].insertId);

  console.log("  Debt cases seeded");

  // Debt notes
  const notesData = [
    { debtCaseId: dc1Id, content: "Ringte kreditor 15.01. Avtalt nedbetaling på 5 000 kr/mnd." },
    { debtCaseId: dc1Id, content: "Fikk bekreftelse på e-post. Rente redusert fra 18% til 12%." },
    { debtCaseId: dc2Id, content: "Mottok inkassovarsel 20.01. Betalingsfrist: 3. februar." },
    { debtCaseId: dc3Id, content: "Søkte om rentenedsettelse. Avventer svar." },
    { debtCaseId: dc3Id, content: "Banken tilbød refinansiering til 9.9%. Vurderer tilbudet." },
    { debtCaseId: dc3Id, content: "Godtok refinansiering. Ny avtale starter 1. mars." },
  ];
  for (const n of notesData) await db.insert(debtNotes).values(n);
  console.log("  Debt notes seeded");

  // Communications
  const commData = [
    { debtCaseId: dc1Id, type: "phone" as const, direction: "sent" as const, date: "2024-01-15T10:30:00", description: "Ringte kundeservice og avtalte nedbetalingsplan på 5 000 kr/mnd." },
    { debtCaseId: dc1Id, type: "email" as const, direction: "received" as const, date: "2024-01-16T09:00:00", description: "Mottok e-post med bekreftelse på nedbetalingsavtale." },
    { debtCaseId: dc1Id, type: "letter" as const, direction: "received" as const, date: "2024-01-10T00:00:00", description: "Mottok purringsbrev med trussel om inkasso." },
    { debtCaseId: dc2Id, type: "letter" as const, direction: "received" as const, date: "2024-01-20T00:00:00", description: "Mottok inkassovarsel fra Hafslund Inkasso. Beløp: 1 423 kr inkl. gebyr." },
    { debtCaseId: dc2Id, type: "phone" as const, direction: "sent" as const, date: "2024-01-22T09:30:00", description: "Ringte inkassoselskapet og ba om betalingsutsettelse." },
    { debtCaseId: dc3Id, type: "email" as const, direction: "sent" as const, date: "2024-01-05T11:00:00", description: "Sendt søknad om rentenedsettelse via nettbank." },
    { debtCaseId: dc3Id, type: "email" as const, direction: "received" as const, date: "2024-01-18T14:00:00", description: "Mottok tilbud om refinansiering til 9.9% fra rådgiver Per Hansen." },
    { debtCaseId: dc3Id, type: "phone" as const, direction: "sent" as const, date: "2024-01-25T09:30:00", description: "Ringte og godtok refinansieringstilbudet. Ny avtale signeres digitalt." },
  ];
  for (const c of commData) await db.insert(communications).values(c);
  console.log("  Communications seeded");

  // Settings
  await db.insert(userSettings).values({ userId, theme: "dark", language: "nb" });
  console.log("  Settings seeded");

  console.log("\n✓ Seed complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
