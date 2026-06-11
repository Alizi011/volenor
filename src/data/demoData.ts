import type {
  Document, Task, InboxItem, AppSettings, CategoryConfig,
  FinanceEntry, Budget, CustomCategory, DebtCase, FamilyMember,
} from '../types';

export const CATEGORIES: CategoryConfig[] = [
  { id: 'invoices', label: 'Fakturaer og regninger', icon: 'Receipt', color: '#fb923c' },
  { id: 'bank', label: 'Bank og skatt', icon: 'Landmark', color: '#7aa8ff' },
  { id: 'id', label: 'ID og juridisk', icon: 'Shield', color: '#4ade80' },
  { id: 'health', label: 'Helse', icon: 'Heart', color: '#f87171' },
  { id: 'vehicle', label: 'Kjøretøy og bolig', icon: 'Home', color: '#e8ff47' },
  { id: 'projects', label: 'Gjøremål og prosjekter', icon: 'Briefcase', color: '#c084fc' },
  { id: 'receipts', label: 'Referanse og kvitteringer', icon: 'Bookmark', color: '#22d3ee' },
];

export const AVAILABLE_ICONS = [
  'Receipt', 'Landmark', 'Shield', 'Heart', 'Home', 'Briefcase', 'Bookmark',
  'Wallet', 'CreditCard', 'Car', 'Plane', 'Book', 'Star', 'Zap', 'Music',
  'Camera', 'Coffee', 'Gift', 'Tool', 'Phone', 'Monitor', 'Gamepad2',
  'Package', 'ShoppingBag', 'UtensilsCrossed', 'Dumbbell', 'PawPrint', 'Baby',
  'GraduationCap', 'Paintbrush', 'Wrench', 'Key', 'Lock',
  'Map', 'Globe', 'Sun', 'Umbrella', 'Bell', 'Flag', 'TreePine',
];

export const AVAILABLE_COLORS = [
  '#fb923c', '#7aa8ff', '#4ade80', '#f87171', '#e8ff47', '#c084fc',
  '#22d3ee', '#f472b6', '#a3e635', '#fb7185', '#818cf8', '#34d399',
  '#fbbf24', '#a78bfa', '#2dd4bf', '#f87171', '#60a5fa', '#a3e635',
];

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'me', name: 'Deg selv', relation: 'Meg', color: '#7aa8ff', notes: 'Hovedbruker', dateOfBirth: '1988-03-15' },
  { id: generateId(), name: 'Kari', relation: 'Ektefelle', color: '#f472b6', notes: '', dateOfBirth: '1990-07-22' },
  { id: generateId(), name: 'Ola', relation: 'Sønn', color: '#4ade80', notes: '', dateOfBirth: '2015-11-03' },
  { id: generateId(), name: 'Ingrid', relation: 'Datter', color: '#c084fc', notes: '', dateOfBirth: '2018-05-19' },
  { id: generateId(), name: 'Kåre', relation: 'Far', color: '#fb923c', notes: 'Bor på sykehjem', dateOfBirth: '1955-01-10' },
];

export const DEMO_DEBT_CASES: DebtCase[] = [
  {
    id: generateId(),
    title: 'Kredittkortgjeld',
    creditor: 'Sbanken',
    originalAmount: 8750000,
    currentAmount: 6200000,
    status: 'payment_plan',
    priority: 'critical',
    memberId: 'me',
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Ringte kreditor 15.01. Avtalt nedbetaling på 5 000 kr/mnd. Første trekk 1. februar.', createdAt: '2024-01-15T10:30:00' },
      { id: generateId(), content: 'Fikk bekreftelse på e-post. Rentesats redusert fra 18% til 12% ved aktiv nedbetaling.', createdAt: '2024-01-16T14:22:00' },
    ],
    communications: [
      { id: generateId(), type: 'phone', direction: 'sent', date: '2024-01-15T10:30:00', description: 'Ringte kundeservice og avtalte nedbetalingsplan på 5 000 kr/mnd.', documentIds: [] },
      { id: generateId(), type: 'email', direction: 'received', date: '2024-01-16T09:00:00', description: 'Mottok e-post med bekreftelse på nedbetalingsavtale.', documentIds: [] },
      { id: generateId(), type: 'letter', direction: 'received', date: '2024-01-10T00:00:00', description: 'Mottok purringsbrev med trussel om inkasso dersom beløpet ikke betales innen 14 dager.', documentIds: [] },
      { id: generateId(), type: 'email', direction: 'sent', date: '2024-01-20T14:00:00', description: 'Sendt e-post med spørsmål om mulighet for ytterligere rentenedsettelse.', documentIds: [] },
    ],
    interestRate: 12,
    dueDate: null,
    referenceNumber: 'SB-8847-2211',
    createdAt: '2024-01-10T09:00:00',
    updatedAt: '2024-01-16T14:22:00',
    closedAt: null,
  },
  {
    id: generateId(),
    title: 'Inkasso - Strømregning',
    creditor: 'Hafslund Inkasso',
    originalAmount: 124500,
    currentAmount: 142300,
    status: 'open',
    priority: 'high',
    memberId: 'me',
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Mottok inkassovarsel 20.01. Må betale innen 14 dager for å unngå tilleggsgebyr.', createdAt: '2024-01-20T08:15:00' },
    ],
    communications: [
      { id: generateId(), type: 'letter', direction: 'received', date: '2024-01-20T00:00:00', description: 'Mottok inkassovarsel fra Hafslund Inkasso. Beløp: 1 423 kr inkl. gebyr. Betalingsfrist: 3. februar.', documentIds: [] },
      { id: generateId(), type: 'phone', direction: 'sent', date: '2024-01-22T09:30:00', description: 'Ringte inkassoselskapet og ba om betalingsutsettelse. Avtalt ny frist til 10. februar.', documentIds: [] },
    ],
    interestRate: 8,
    dueDate: '2024-02-03',
    referenceNumber: 'INK-2024-004412',
    createdAt: '2024-01-20T08:15:00',
    updatedAt: '2024-01-20T08:15:00',
    closedAt: null,
  },
  {
    id: generateId(),
    title: 'Forbrukslån',
    creditor: 'Santander',
    originalAmount: 15000000,
    currentAmount: 9800000,
    status: 'negotiating',
    priority: 'high',
    memberId: 'me',
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Søkte om rentenedsettelse. Avventer svar fra banken.', createdAt: '2024-01-05T11:00:00' },
      { id: generateId(), content: 'Banken tilbød refinansiering til 9.9%. Vurderer tilbudet.', createdAt: '2024-01-18T16:45:00' },
      { id: generateId(), content: 'Ringte tilbake og godtok refinansiering. Ny avtale starter 1. mars.', createdAt: '2024-01-25T09:30:00' },
    ],
    communications: [
      { id: generateId(), type: 'email', direction: 'sent', date: '2024-01-05T11:00:00', description: 'Sendt søknad om rentenedsettelse via nettbank.', documentIds: [] },
      { id: generateId(), type: 'email', direction: 'received', date: '2024-01-18T14:00:00', description: 'Mottok tilbud om refinansiering til 9.9% fra rådgiver Per Hansen.', documentIds: [] },
      { id: generateId(), type: 'phone', direction: 'sent', date: '2024-01-25T09:30:00', description: 'Ringte og godtok refinansieringstilbudet. Ny avtale signeres digitalt.', documentIds: [] },
    ],
    interestRate: 9.9,
    dueDate: null,
    referenceNumber: 'SAN-LOAN-9921',
    createdAt: '2023-06-15T10:00:00',
    updatedAt: '2024-01-25T09:30:00',
    closedAt: null,
  },
  {
    id: generateId(),
    title: 'Studielån (Lånekassen)',
    creditor: 'Lånekassen',
    originalAmount: 38000000,
    currentAmount: 21000000,
    status: 'payment_plan',
    priority: 'medium',
    memberId: 'me',
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Ordinær nedbetaling etter ferdig utdanelse. Trekk månedlig fra lønn.', createdAt: '2020-08-01T00:00:00' },
    ],
    communications: [
      { id: generateId(), type: 'letter', direction: 'received', date: '2020-08-01T00:00:00', description: 'Mottok velkomstbrev fra Lånekassen med informasjon om nedbetalingsplan.', documentIds: [] },
    ],
    interestRate: 5.5,
    dueDate: null,
    referenceNumber: 'LK-4455-88-1234',
    createdAt: '2020-08-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
    closedAt: null,
  },
  {
    id: generateId(),
    title: 'Bilfinansiering',
    creditor: 'Danske Bank',
    originalAmount: 28000000,
    currentAmount: 12500000,
    status: 'payment_plan',
    priority: 'medium',
    memberId: 'me',
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Månedlig termin: 3 200 kr. God rente p.g.a. sikkerhet i bil.', createdAt: '2022-03-15T00:00:00' },
      { id: generateId(), content: 'Restverdi ved endt løpetid: 45 000 kr. Vurderer å selge bilen.', createdAt: '2024-01-12T10:00:00' },
    ],
    communications: [
      { id: generateId(), type: 'meeting', direction: 'received', date: '2022-03-10T13:00:00', description: 'Møte med rådgiver i Danske Bank. Gjennomgikk lånevilkår og signerte lånedokumenter.', documentIds: [] },
      { id: generateId(), type: 'email', direction: 'sent', date: '2024-01-12T10:00:00', description: 'Sendt e-post om spørsmål angående tidlig innløsning av lån.', documentIds: [] },
    ],
    interestRate: 4.2,
    dueDate: null,
    referenceNumber: 'DB-AUTO-7788',
    createdAt: '2022-03-15T00:00:00',
    updatedAt: '2024-01-12T10:00:00',
    closedAt: null,
  },
  {
    id: generateId(),
    title: 'Inkasso - Legeutgifter',
    creditor: 'Visma Collectors',
    originalAmount: 45000,
    currentAmount: 52000,
    status: 'resolved',
    priority: 'low',
    memberId: DEMO_FAMILY_MEMBERS[2].id,
    documentIds: [],
    notes: [
      { id: generateId(), content: 'Egenandel fra legebesøk for Ola. Inkasso pga. glemt betaling.', createdAt: '2024-01-08T09:00:00' },
      { id: generateId(), content: 'Betalt i sin helhet. Fikk kvittering.', createdAt: '2024-01-22T14:00:00' },
    ],
    communications: [
      { id: generateId(), type: 'letter', direction: 'received', date: '2024-01-08T00:00:00', description: 'Mottok inkassovarsel fra Visma Collectors. Egenandel legebesøk for Ola.', documentIds: [] },
      { id: generateId(), type: 'phone', direction: 'sent', date: '2024-01-10T11:00:00', description: 'Ringte Visma Collectors og fikk bekreftet beløp. Betalte via nettbank samme dag.', documentIds: [] },
      { id: generateId(), type: 'email', direction: 'received', date: '2024-01-22T13:00:00', description: 'Mottok kvittering og bekreftelse på at saken er lukket.', documentIds: [] },
    ],
    interestRate: null,
    dueDate: null,
    referenceNumber: 'VC-2024-00891',
    createdAt: '2024-01-08T09:00:00',
    updatedAt: '2024-01-22T14:00:00',
    closedAt: '2024-01-22T14:00:00',
  },
];

// Keep existing demo data below
export const TASK_CATEGORIES = [
  { id: 'invoice' as const, label: 'Faktura å betale', color: '#fb923c' },
  { id: 'signature' as const, label: 'Dokument å signere', color: '#7aa8ff' },
  { id: 'scan' as const, label: 'Husk å skanne', color: '#e8ff47' },
  { id: 'other' as const, label: 'Annet', color: '#c084fc' },
];

export const DEMO_DOCUMENTS: Document[] = [
  { id: generateId(), name: '2024-01-15_Faktura_Strøm.pdf', category: 'invoices', date: '2024-01-15', size: 245760, type: 'pdf', tags: ['strøm', 'månedlig'], notes: 'Strømregning for januar 2024. Beløp: 1 245 kr.' },
  { id: generateId(), name: '2024-01-10_Bank_Kontoutskrift.pdf', category: 'bank', date: '2024-01-10', size: 512000, type: 'pdf', tags: ['bank', 'kontoutskrift'], notes: 'Desember kontoutskrift fra DNB.' },
  { id: generateId(), name: '2024-01-08_ID_Pass.pdf', category: 'id', date: '2024-01-08', size: 1048576, type: 'pdf', tags: ['pass', 'id', 'reise'], notes: 'Kopi av pass. Gyldig til 2029.' },
  { id: generateId(), name: '2023-12-20_Helse_Legeerklæring.pdf', category: 'health', date: '2023-12-20', size: 307200, type: 'pdf', tags: ['lege', 'erklæring'], notes: 'Legeerklæring fra fastlegen.' },
  { id: generateId(), name: '2023-12-15_Faktura_Forsikring.pdf', category: 'invoices', date: '2023-12-15', size: 189440, type: 'pdf', tags: ['forsikring', 'årlig'], notes: 'Årlig forsikringspremie. Dekker hus, bil og innbo.' },
  { id: generateId(), name: '2023-12-01_Vehicle_Bilservice.pdf', category: 'vehicle', date: '2023-12-01', size: 420000, type: 'pdf', tags: ['bil', 'service'], notes: 'Service på Toyota Corolla. Neste service om 15 000 km.' },
  { id: generateId(), name: '2023-11-28_Bank_Skatteoppgjør.pdf', category: 'bank', date: '2023-11-28', size: 890000, type: 'pdf', tags: ['skatt', '2023'], notes: 'Skatteoppgjør 2023. Til gode: 4 320 kr.' },
  { id: generateId(), name: '2023-11-15_Faktura_Vann.pdf', category: 'invoices', date: '2023-11-15', size: 156000, type: 'pdf', tags: ['vann', 'månedlig'], notes: 'Vannavgift for november.' },
  { id: generateId(), name: '2023-10-20_Referanse_Kvittering_Maling.pdf', category: 'receipts', date: '2023-10-20', size: 98000, type: 'pdf', tags: ['kvittering', 'maling'], notes: 'Kvittering for maling til stuen.' },
  { id: generateId(), name: '2023-10-01_ID_Leiekontrakt.pdf', category: 'id', date: '2023-10-01', size: 450000, type: 'pdf', tags: ['kontrakt', 'leie'], notes: 'Leiekontrakt for leiligheten. Løper til 30. september 2024.' },
  { id: generateId(), name: '2023-09-15_Faktura_Internet.pdf', category: 'invoices', date: '2023-09-15', size: 132000, type: 'pdf', tags: ['internet', 'månedlig'], notes: 'Internetregning for september.' },
  { id: generateId(), name: '2023-09-01_Projects_Husprosjekt.pdf', category: 'projects', date: '2023-09-01', size: 2100000, type: 'pdf', tags: ['hus', 'prosjekt'], notes: 'Oversikt over husprosjektet. Budsjett og tidsplan.' },
  { id: generateId(), name: '2023-08-20_Health_Vaksinasjon.pdf', category: 'health', date: '2023-08-20', size: 178000, type: 'pdf', tags: ['vaksine', 'reise'], notes: 'Vaksinasjonsbevis for reise til Asia.' },
  { id: generateId(), name: '2023-08-01_Vehicle_Boligsalg.pdf', category: 'vehicle', date: '2023-08-01', size: 890000, type: 'pdf', tags: ['bolig', 'salg'], notes: 'Dokumenter vedrørende salg av leilighet.' },
  { id: generateId(), name: '2024-01-20_Referanse_Garanti_TV.pdf', category: 'receipts', date: '2024-01-20', size: 112000, type: 'pdf', tags: ['garanti', 'tv'], notes: 'Garantibevis for Samsung TV. 5 års garanti.' },
  { id: generateId(), name: '2024-01-05_Bank_Lån.pdf', category: 'bank', date: '2024-01-05', size: 680000, type: 'pdf', tags: ['lån', 'bolig'], notes: 'Boliglånsdokumenter. Rente: 4.2%.' },
  { id: generateId(), name: '2023-12-10_Projects_Julegaveplan.pdf', category: 'projects', date: '2023-12-10', size: 45000, type: 'pdf', tags: ['julegaver', 'plan'], notes: 'Liste over julegaver og budsjett.' },
  { id: generateId(), name: '2023-11-05_Health_Resept.pdf', category: 'health', date: '2023-11-05', size: 89000, type: 'pdf', tags: ['resept', 'medisin'], notes: 'Resept på allergimedisin.' },
  { id: generateId(), name: '2024-02-01_Faktura_Telefon.pdf', category: 'invoices', date: '2024-02-01', size: 145000, type: 'pdf', tags: ['telefon', 'månedlig'], notes: 'Mobilregning for januar.' },
  { id: generateId(), name: '2024-01-25_Bank_Kredittkort.pdf', category: 'bank', date: '2024-01-25', size: 230000, type: 'pdf', tags: ['kredittkort', 'faktura'], notes: 'Kredittkortregning.' },
  { id: generateId(), name: '2023-12-28_Vehicle_Bilforsikring.pdf', category: 'vehicle', date: '2023-12-28', size: 312000, type: 'pdf', tags: ['bil', 'forsikring'], notes: 'Bilforsikring for 2024.' },
  { id: generateId(), name: '2024-01-30_Projects_Reiseplan.pdf', category: 'projects', date: '2024-01-30', size: 156000, type: 'pdf', tags: ['reise', 'plan'], notes: 'Reiseplan for sommerferien 2024.' },
  { id: generateId(), name: '2023-10-15_Referanse_Kvittering_Bilde.pdf', category: 'receipts', date: '2023-10-15', size: 2340000, type: 'image', tags: ['kvittering', 'bilde'], notes: 'Kvittering for nytt kamera.' },
  { id: generateId(), name: '2023-07-20_ID_Vigselsattest.pdf', category: 'id', date: '2023-07-20', size: 198000, type: 'pdf', tags: ['vigselsattest', 'ekteskap'], notes: 'Vigselsattest fra kirken.' },
];

export const DEMO_TASKS: Task[] = [
  { id: generateId(), title: 'Betale strømregning', category: 'invoice', dueDate: '2024-02-01', priority: 'high', status: 'new', tags: ['strøm', 'månedlig'], notes: 'Strømregning for januar. Beløp: 1 245 kr.' },
  { id: generateId(), title: 'Signere leiekontrakt', category: 'signature', dueDate: '2024-02-15', priority: 'high', status: 'new', tags: ['kontrakt', 'leie'], notes: 'Ny leiekontrakt må signeres og returneres.' },
  { id: generateId(), title: 'Skanne gamle kvitteringer', category: 'scan', dueDate: '2024-02-28', priority: 'medium', status: 'in_progress', tags: ['kvittering', 'arkiv'], notes: 'Skanne og kategorisere kvitteringer fra 2023.' },
  { id: generateId(), title: 'Betale internetregning', category: 'invoice', dueDate: '2024-02-05', priority: 'medium', status: 'new', tags: ['internet', 'månedlig'], notes: 'Internetregning for januar.' },
  { id: generateId(), title: 'Oppdatere forsikring', category: 'other', dueDate: '2024-03-01', priority: 'medium', status: 'in_progress', tags: ['forsikring', 'årlig'], notes: 'Sammenligne forsikringstilbud før fornyelse.' },
  { id: generateId(), title: 'Signere skattedokumenter', category: 'signature', dueDate: '2024-04-30', priority: 'low', status: 'new', tags: ['skatt', '2024'], notes: 'Signere og sende inn skattedokumenter.' },
  { id: generateId(), title: 'Skanne helsepapirer', category: 'scan', dueDate: '2024-03-15', priority: 'low', status: 'done', tags: ['helse', 'papirer'], notes: 'Skanne og arkivere helserelaterte dokumenter.' },
  { id: generateId(), title: 'Betale kredittkort', category: 'invoice', dueDate: '2024-02-10', priority: 'high', status: 'new', tags: ['kredittkort', 'månedlig'], notes: 'Kredittkortregning for januar.' },
  { id: generateId(), title: 'Sende bil til service', category: 'other', dueDate: '2024-03-20', priority: 'medium', status: 'in_progress', tags: ['bil', 'service'], notes: 'Bestille time for bilservice.' },
  { id: generateId(), title: 'Arkivere gamle prosjekter', category: 'other', dueDate: '2024-04-01', priority: 'low', status: 'done', tags: ['arkiv', 'prosjekter'], notes: 'Rydde opp i gamle prosjektfiler.' },
  { id: generateId(), title: 'Betale vannavgift', category: 'invoice', dueDate: '2024-02-15', priority: 'medium', status: 'new', tags: ['vann', 'månedlig'], notes: 'Vannavgift for februar.' },
  { id: generateId(), title: 'Skanne forsikringspapirer', category: 'scan', dueDate: '2024-02-20', priority: 'medium', status: 'in_progress', tags: ['forsikring', 'scan'], notes: 'Skanne nye forsikringsdokumenter.' },
];

export const DEMO_INBOX: InboxItem[] = [
  { id: generateId(), name: '2024-01-28_Faktura_Mobil.pdf', date: '2024-01-28', size: 145000, type: 'pdf' },
  { id: generateId(), name: '2024-01-25_Kvittering_Butikk.pdf', date: '2024-01-25', size: 89000, type: 'pdf' },
  { id: generateId(), name: '2024-01-22_Dokument_Bank.pdf', date: '2024-01-22', size: 320000, type: 'pdf' },
  { id: generateId(), name: '2024-01-20_Notat_Lege.pdf', date: '2024-01-20', size: 167000, type: 'pdf' },
  { id: generateId(), name: '2024-01-18_Kontrakt_Bil.pdf', date: '2024-01-18', size: 450000, type: 'pdf' },
];

export const DEMO_FINANCES: FinanceEntry[] = [
  { id: generateId(), title: 'Strømregning', amount: 124500, type: 'expense', category: 'invoices', date: '2024-01-15', status: 'pending', notes: ' Januar strøm', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Forsikring', amount: 245000, type: 'expense', category: 'invoices', date: '2024-01-05', status: 'paid', notes: 'Årlig forsikringspremie', isRecurring: true, recurringInterval: 'yearly' },
  { id: generateId(), title: 'Internet', amount: 69900, type: 'expense', category: 'invoices', date: '2024-01-10', status: 'paid', notes: 'Fibernett', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Telefon', amount: 49900, type: 'expense', category: 'invoices', date: '2024-02-01', status: 'pending', notes: 'Mobilabonnement', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Lønn', amount: 4500000, type: 'income', category: 'income', date: '2024-01-25', status: 'paid', notes: 'Månedslønn', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Bilservice', amount: 350000, type: 'expense', category: 'vehicle', date: '2024-01-20', status: 'paid', notes: 'Årlig service', isRecurring: true, recurringInterval: 'yearly' },
  { id: generateId(), title: 'Vannavgift', amount: 58000, type: 'expense', category: 'invoices', date: '2024-01-15', status: 'pending', notes: 'Kvartalsvis', isRecurring: true, recurringInterval: 'quarterly' },
  { id: generateId(), title: 'Skatteoppgjør', amount: 432000, type: 'income', category: 'bank', date: '2023-11-28', status: 'paid', notes: 'Til gode fra skatteetaten', isRecurring: false },
  { id: generateId(), title: 'Kredittkort', amount: 875000, type: 'expense', category: 'invoices', date: '2024-01-25', status: 'pending', notes: 'Desember forbruk', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Bilforsikring', amount: 1280000, type: 'expense', category: 'vehicle', date: '2024-01-02', status: 'paid', notes: 'Årlig bilforsikring', isRecurring: true, recurringInterval: 'yearly' },
  { id: generateId(), title: 'Leieinntekt', amount: 1200000, type: 'income', category: 'income', date: '2024-01-01', status: 'paid', notes: 'Utleie av hybel', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Matvarer', amount: 520000, type: 'expense', category: 'expense', date: '2024-01-28', status: 'paid', notes: 'Månedlig matbudsjett', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Streaming', amount: 31900, type: 'expense', category: 'expense', date: '2024-01-05', status: 'paid', notes: 'Netflix, Spotify, etc.', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Transport', amount: 180000, type: 'expense', category: 'expense', date: '2024-01-30', status: 'paid', notes: 'Buss, tog, drivstoff', isRecurring: true, recurringInterval: 'monthly' },
  { id: generateId(), title: 'Helse', amount: 25000, type: 'expense', category: 'health', date: '2024-01-18', status: 'paid', notes: 'Egenandel fastlege', isRecurring: false },
];

export const DEMO_BUDGETS: Budget[] = [
  { id: generateId(), category: 'invoices', monthlyLimit: 600000 },
  { id: generateId(), category: 'vehicle', monthlyLimit: 300000 },
  { id: generateId(), category: 'expense', monthlyLimit: 1000000 },
  { id: generateId(), category: 'income', monthlyLimit: 0 },
];

export const DEMO_CUSTOM_CATEGORIES: CustomCategory[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'nb',
  lastVisited: new Date().toISOString(),
};
