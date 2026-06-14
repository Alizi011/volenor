import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

// Parse JSON fields from DB
const parseJsonArr = (val: string | null | undefined): string[] => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};

// DB returns number IDs but frontend expects string IDs
const fmtDoc = (d: any) => ({ ...d, id: String(d.id), tags: parseJsonArr(d.tags), size: d.size ?? 0 });
const fmtTask = (d: any) => ({ ...d, id: String(d.id), tags: parseJsonArr(d.tags), notes: d.notes ?? '' });
const fmtInbox = (d: any) => ({ ...d, id: String(d.id), size: d.size ?? 0 });
const fmtFinance = (d: any) => ({ ...d, id: String(d.id), notes: d.notes ?? '', isRecurring: !!d.isRecurring });
const fmtFamily = (d: any) => ({ ...d, id: String(d.id), notes: d.notes ?? '' });
const fmtDebt = (d: any) => ({ ...d, id: String(d.id), documentIds: parseJsonArr(d.documentIds), notes: [], communications: [] });
const fmtCat = (d: any) => ({ ...d, id: String(d.id) });

export function useSynapseDocuments() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.documents.list.useQuery();
  const create = trpc.synapse.documents.create.useMutation({ onSuccess: () => utils.synapse.documents.list.invalidate() });
  const del = trpc.synapse.documents.delete.useMutation({ onSuccess: () => utils.synapse.documents.list.invalidate() });

  return {
    documents: (data ?? []).map(fmtDoc),
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
    tasks: (data ?? []).map(fmtTask),
    isLoading,
    addTask: useCallback((t: any) => create.mutate(t), [create]),
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
    inbox: (data ?? []).map(fmtInbox),
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
    finances: (data ?? []).map(fmtFinance),
    isLoading,
    addFinance: useCallback((f: any) => create.mutate(f), [create]),
    deleteFinance: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseBudgets() {
  const utils = trpc.useUtils();
  const { data } = trpc.synapse.budgets.list.useQuery();
  const create = trpc.synapse.budgets.create.useMutation({ onSuccess: () => utils.synapse.budgets.list.invalidate() });

  return {
    budgets: (data ?? []).map(fmtCat),
    addBudget: useCallback((b: any) => create.mutate(b), [create]),
  };
}

export function useSynapseDebtCases() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.synapse.debtCases.list.useQuery();
  const create = trpc.synapse.debtCases.create.useMutation({ onSuccess: () => { utils.synapse.debtCases.list.invalidate(); } });
  const update = trpc.synapse.debtCases.update.useMutation({ onSuccess: () => utils.synapse.debtCases.list.invalidate() });
  const close = trpc.synapse.debtCases.close.useMutation({ onSuccess: () => utils.synapse.debtCases.list.invalidate() });
  const del = trpc.synapse.debtCases.delete.useMutation({ onSuccess: () => { utils.synapse.debtCases.list.invalidate(); utils.synapse.debtNotes.list.invalidate(); } });

  return {
    cases: (data ?? []).map(fmtDebt),
    isLoading,
    addCase: useCallback((c: any) => create.mutate({ ...c, memberId: c.memberId ? String(c.memberId) : null }), [create]),
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
    members: (data ?? []).map(fmtFamily),
    isLoading,
    addMember: useCallback((m: any) => create.mutate(m), [create]),
    deleteMember: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}

export function useSynapseCategories() {
  const utils = trpc.useUtils();
  const { data } = trpc.synapse.categories.list.useQuery();
  const create = trpc.synapse.categories.create.useMutation({ onSuccess: () => utils.synapse.categories.list.invalidate() });
  const del = trpc.synapse.categories.delete.useMutation({ onSuccess: () => utils.synapse.categories.list.invalidate() });

  return {
    customCategories: (data ?? []).map(fmtCat),
    addCategory: useCallback((c: any) => create.mutate(c), [create]),
    deleteCategory: useCallback((id: string) => del.mutate({ id: Number(id) }), [del]),
  };
}
