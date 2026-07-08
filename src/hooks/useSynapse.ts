import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

// Parse JSON fields from DB
const parseJsonArr = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return [];

  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// DB returns number IDs but frontend expects string IDs
const safeId = (id: unknown) =>
  id === null || id === undefined ? undefined : String(id);

const fmtDoc = (d: any) => ({
  ...d,
  id: safeId(d.id),
  category: String(d.category ?? '').trim(),
  tags: parseJsonArr(d.tags),
  size: Number(d.size ?? 0),
  amount:
    d.amount !== null && d.amount !== undefined
      ? Number(d.amount)
      : null,
  notes: d.notes ?? '',
});

const fmtTask = (d: any) => ({ ...d, id: safeId(d.id), tags: parseJsonArr(d.tags), notes: d.notes ?? '' });
const fmtInbox = (d: any) => ({ ...d, id: safeId(d.id), size: d.size ?? 0 });
const fmtFinance = (d: any) => ({ ...d, id: safeId(d.id), notes: d.notes ?? '', isRecurring: !!d.isRecurring });
const fmtBankAccount = (d: any) => ({
  ...d,
  id: safeId(d.id),
  familyMemberId: d.familyMemberId ?? null,
  ownerFamilyMemberId: d.ownerFamilyMemberId ?? null,
  accountHolderName: d.accountHolderName ?? '',
  disposersJson: d.disposersJson ?? '[]',
  bankName: d.bankName ?? '',
  accountNumber: d.accountNumber ?? '',
  accountName: d.accountName ?? '',
  accountType: d.accountType ?? '',
  includeInAnalysis: Number(d.includeInAnalysis ?? 1),
});
const fmtFamily = (d: any) => ({ ...d, id: safeId(d.id), notes: d.notes ?? '' });
const fmtDebt = (d: any) => ({ ...d, id: safeId(d.id), documentIds: parseJsonArr(d.documentIds), notes: [], communications: [] });
const fmtCat = (d: any) => ({ ...d, id: safeId(d.id) });

export function useSynapseDocuments() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.documents.list.useQuery();
  const create = trpc.synapse.documents.create.useMutation({
  onSuccess: async () => {
    await utils.synapse.documents.list.invalidate();
      await utils.synapse.documents.list.refetch();
  
    },
  });

  const update = trpc.synapse.documents.update.useMutation({
  onSuccess: async () => {
    await utils.synapse.documents.list.invalidate();
    await utils.synapse.documents.list.refetch();
  },
});
  
  const del = trpc.synapse.documents.delete.useMutation({ onSuccess: () => utils.synapse.documents.list.invalidate() });

  return {
    documents: (data ?? []).filter((d: any) => d.id != null).map(fmtDoc),
    isLoading,
    addDocument: useCallback(
  (doc: any) =>
    create.mutate({
      name: doc.name,
      category: doc.category,
      date: doc.date ?? new Date().toISOString().slice(0, 10),
      size: doc.size ?? 0,
      type: doc.type ?? "pdf",
      tags: Array.isArray(doc.tags) ? JSON.stringify(doc.tags) : doc.tags ?? "[]",
      notes: doc.notes ?? "",
      fileData: doc.fileData,
      familyMemberId: doc.familyMemberId,
    }),
  [create],
),

updateDocument: useCallback(
  (doc: any) =>
    update.mutate({
      id: Number(doc.id),
      data: {
        name: doc.name,
        category: doc.category,
        date: doc.date,
        amount: Number(doc.amount ?? 0),
        tags: JSON.stringify(doc.tags ?? []),
        notes: doc.notes ?? '',
      },
    }),
  [update],
),

    deleteDocument: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseTasks() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.tasks.list.useQuery()
  const create = trpc.synapse.tasks.create.useMutation({ onSuccess: () => utils.synapse.tasks.list.invalidate() });
  const update = trpc.synapse.tasks.update.useMutation({ onSuccess: () => utils.synapse.tasks.list.invalidate() });
  const del = trpc.synapse.tasks.delete.useMutation({ onSuccess: () => utils.synapse.tasks.list.invalidate() });

  return {
    tasks: (data ?? []).filter((d: any) => d.id != null).map(fmtTask),
    isLoading,
    addTask: useCallback(
  (t: any) =>
    create.mutate({
      title: t.title,
      category: t.category,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status ?? 'new',
      tags: Array.isArray(t.tags) ? JSON.stringify(t.tags) : t.tags ?? '[]',
      notes: t.notes ?? '',
      familyMemberId: t.familyMemberId,
    }),
  [create],
),
    updateTask: useCallback((id: string, data: any) => update.mutate({ id: Number(id), data }), [update]),
    deleteTask: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseInbox() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.inbox.list.useQuery();
  const create = trpc.synapse.inbox.create.useMutation({ onSuccess: () => utils.synapse.inbox.list.invalidate() });
  const del = trpc.synapse.inbox.delete.useMutation({ onSuccess: () => utils.synapse.inbox.list.invalidate() });

  return {
    inbox: (data ?? []).filter((d: any) => d.id != null).map(fmtInbox),
    isLoading,
    addInboxItem: useCallback((i: any) => create.mutate(i), [create]),
    removeInboxItem: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseFinances() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.finances.list.useQuery();
  const create = trpc.synapse.finances.create.useMutation({ onSuccess: () => utils.synapse.finances.list.invalidate() });
  const del = trpc.synapse.finances.delete.useMutation({ onSuccess: () => utils.synapse.finances.list.invalidate() });

  return {
    finances: (data ?? []).filter((d: any) => d.id != null).map(fmtFinance),
    isLoading,
    addFinance: useCallback(
  (f: any) =>
    create.mutate({
      title: f.title,
      amount: Number(f.amount),
      type: f.type,
      category: f.category,
      date: f.date,
      status: f.status,
      notes: f.notes ?? '',
      isRecurring: f.isRecurring ? 1 : 0,
      recurringInterval: f.recurringInterval,
      familyMemberId: f.familyMemberId,
    }),
  [create],
),
    deleteFinance: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseBankAccounts() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.bankAccounts.list.useQuery();

  const create = trpc.synapse.bankAccounts.create.useMutation({
    onSuccess: () => utils.synapse.bankAccounts.list.invalidate(),
  });

  const update = trpc.synapse.bankAccounts.update.useMutation({
    onSuccess: () => utils.synapse.bankAccounts.list.invalidate(),
  });

  const del = trpc.synapse.bankAccounts.delete.useMutation({
    onSuccess: () => utils.synapse.bankAccounts.list.invalidate(),
  });

  return {
    bankAccounts: (data ?? []).filter((d: any) => d.id != null).map(fmtBankAccount),
    isLoading,
    addBankAccount: useCallback((account: any) => create.mutate(account), [create]),
    updateBankAccount: useCallback(
      (id: string, data: any) => update.mutate({ id: Number(id), data }),
      [update],
    ),
    deleteBankAccount: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseFinancialItems() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.synapse.financialItems.list.useQuery();

  const create = trpc.synapse.financialItems.create.useMutation({
    onSuccess: () => utils.synapse.financialItems.list.invalidate(),
  });

  const markAsPaid = trpc.synapse.financialItems.markAsPaid.useMutation({
    onSuccess: () => utils.synapse.financialItems.list.invalidate(),
  });

  return {
    financialItems: (data ?? []).filter((d: any) => d.id != null),
    isLoading,
    addFinancialItem: create.mutateAsync,
    markFinancialItemAsPaid: markAsPaid.mutateAsync,
  };
}

export function useSynapseBudgets() {
  const utils = trpc.useUtils();
  const { data } = trpc.synapse.budgets.list.useQuery();
  const create = trpc.synapse.budgets.create.useMutation({ onSuccess: () => utils.synapse.budgets.list.invalidate() });

  return {
    budgets: (data ?? []).filter((d: any) => d.id != null).map(fmtCat),
    addBudget: useCallback(
  (b: any) =>
    create.mutate({
      category: b.category,
      monthlyLimit: Number(b.monthlyLimit),
    }),
  [create],
),

  };
}

export function useSynapseDebtCases() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.cases.list.useQuery();
  const create = trpc.synapse.debtCases.create.useMutation({ onSuccess: () => { utils.synapse.debtCases.list.invalidate(); } });
  const update = trpc.synapse.debtCases.update.useMutation({ onSuccess: () => utils.synapse.debtCases.list.invalidate() });
  const close = trpc.synapse.debtCases.close.useMutation({ onSuccess: () => utils.synapse.debtCases.list.invalidate() });
  const del = trpc.synapse.debtCases.delete.useMutation({ onSuccess: () => { utils.synapse.debtCases.list.invalidate(); utils.synapse.debtNotes.list.invalidate(); } });

  return {
    cases: (data ?? []).filter((d: any) => d.id != null),
    isLoading,
    addCase: useCallback(
  (c: any) =>
    create.mutate({
      title: c.title,
      creditor: c.creditor,
      originalAmount: Number(c.originalAmount),
      currentAmount: Number(c.currentAmount),
      status: c.status ?? 'open',
      priority: c.priority ?? 'medium',
      familyMemberId: c.familyMemberId ? Number(c.familyMemberId) : undefined,
      documentIds: Array.isArray(c.documentIds) ? JSON.stringify(c.documentIds) : c.documentIds ?? '[]',
      interestRate: c.interestRate !== null && c.interestRate !== undefined && c.interestRate !== ''
        ? Number(c.interestRate)
        : null,
      dueDate: c.dueDate ?? null,
      referenceNumber: c.referenceNumber ?? '',
    }),
  [create],
),
    updateCase: useCallback((id: string, data: any) => update.mutate({ id: Number(id), data }), [update]),
    deleteCase: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
    closeCase: useCallback((id: string) => close.mutate({ id: Number(id) }), [close]),
  };
}

export function useSynapseDebtNotes() {
  const utils = trpc.useUtils();
  const create = trpc.synapse.debtNotes.create.useMutation({ onSuccess: () => utils.synapse.debtNotes.list.invalidate() });
  const list = trpc.synapse.debtNotes.list;

  return {
    create,
    list,
  };
}

export function useSynapseCommunications() {
  const utils = trpc.useUtils();
  const create = trpc.synapse.communications.create.useMutation({ onSuccess: () => utils.synapse.communications.list.invalidate() });
  const list = trpc.synapse.communications.list;

  return {
    create,
    list,
  };
}

export function useSynapseFamily() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.family.list.useQuery();
  const create = trpc.synapse.family.create.useMutation({ onSuccess: () => utils.synapse.family.list.invalidate() });
  const del = trpc.synapse.family.delete.useMutation({ onSuccess: () => utils.synapse.family.list.invalidate() });

  return {
    members: (data ?? []).filter((d: any) => d.id != null).map(fmtFamily),
    isLoading,
    addMember: useCallback(
  (m: any) =>
    create.mutate({
      name: m.name,
      relation: m.relation,
      color: m.color,
      notes: m.notes ?? '',
      dateOfBirth: m.dateOfBirth ?? null,
    }),
  [create],
),
    deleteMember: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseCategories() {
  const utils = trpc.useUtils();
  const { data } = trpc.synapse.categories.list.useQuery();
  const create = trpc.synapse.categories.create.useMutation({ onSuccess: () => utils.synapse.categories.list.invalidate() });
  const del = trpc.synapse.categories.delete.useMutation({ onSuccess: () => utils.synapse.categories.list.invalidate() });

  return {
    customCategories: (data ?? []).filter((d: any) => d.id != null).map(fmtCat),
    addCategory: useCallback((c: any) => create.mutate(c), [create]),
    deleteCategory: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseCalendar() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.synapse.calendar.list.useQuery();

  const create = trpc.synapse.calendar.create.useMutation({
    onSuccess: () => utils.synapse.calendar.list.invalidate(),
  });

  const del = trpc.synapse.calendar.delete.useMutation({
    onSuccess: () => utils.synapse.calendar.list.invalidate(),
  });

  return {
    calendarEvents: (data ?? [])
      .filter((d: any) => d.id != null)
      .map((d: any) => ({
        ...d,
        id: safeId(d.id),
        title: d.title ?? '',
        description: d.description ?? '',
        startDate: d.startDate,
        endDate: d.endDate,
        color: d.color ?? '#e8ff47',
      })),

    isLoading,

    addCalendarEvent: useCallback(
      (event: any) =>
        create.mutate({
          title: event.title,
          description: event.description ?? '',
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color ?? '#e8ff47',
        }),
      [create],
    ),

    deleteCalendarEvent: useCallback(
      (id: string) => del.mutate({ id: Number(id) }),
      [del],
    ),
  };
}
