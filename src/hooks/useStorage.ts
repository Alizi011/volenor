import { useState, useEffect, useCallback } from 'react';
import type {
  Document, Task, InboxItem, AppSettings, CustomCategory,
  FinanceEntry, Budget, DebtCase, FamilyMember,
} from '../types';
import {
  DEMO_DOCUMENTS,
  DEMO_TASKS,
  DEMO_INBOX,
  DEMO_FINANCES,
  DEMO_BUDGETS,
  DEMO_CUSTOM_CATEGORIES,
  DEMO_FAMILY_MEMBERS,
  DEMO_DEBT_CASES,
  DEFAULT_SETTINGS,
} from '../data/demoData';

const STORAGE_KEYS = {
  documents: 'synapse_documents',
  tasks: 'synapse_tasks',
  inbox: 'synapse_inbox',
  settings: 'synapse_settings',
  customCategories: 'synapse_custom_categories',
  finances: 'synapse_finances',
  budgets: 'synapse_budgets',
  familyMembers: 'synapse_family_members',
  debtCases: 'synapse_debt_cases',
  initialized: 'synapse_initialized',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

function initDemoData() {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    saveToStorage(STORAGE_KEYS.documents, DEMO_DOCUMENTS);
    saveToStorage(STORAGE_KEYS.tasks, DEMO_TASKS);
    saveToStorage(STORAGE_KEYS.inbox, DEMO_INBOX);
    saveToStorage(STORAGE_KEYS.customCategories, DEMO_CUSTOM_CATEGORIES);
    saveToStorage(STORAGE_KEYS.finances, DEMO_FINANCES);
    saveToStorage(STORAGE_KEYS.budgets, DEMO_BUDGETS);
    saveToStorage(STORAGE_KEYS.familyMembers, DEMO_FAMILY_MEMBERS);
    saveToStorage(STORAGE_KEYS.debtCases, DEMO_DEBT_CASES);
    saveToStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

export function useDocuments() {
  initDemoData();
  const [documents, setDocuments] = useState<Document[]>(() =>
    loadFromStorage<Document[]>(STORAGE_KEYS.documents, [])
  );
  useEffect(() => { saveToStorage(STORAGE_KEYS.documents, documents); }, [documents]);
  const addDocument = useCallback((doc: Document) => { setDocuments((prev) => [doc, ...prev]); }, []);
  const updateDocument = useCallback((id: string, updates: Partial<Document>) => { setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d))); }, []);
  const deleteDocument = useCallback((id: string) => { setDocuments((prev) => prev.filter((d) => d.id !== id)); }, []);
  return { documents, addDocument, updateDocument, deleteDocument };
}

export function useTasks() {
  initDemoData();
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage<Task[]>(STORAGE_KEYS.tasks, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.tasks, tasks); }, [tasks]);
  const addTask = useCallback((task: Task) => { setTasks((prev) => [task, ...prev]); }, []);
  const updateTask = useCallback((id: string, updates: Partial<Task>) => { setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t))); }, []);
  const deleteTask = useCallback((id: string) => { setTasks((prev) => prev.filter((t) => t.id !== id)); }, []);
  return { tasks, addTask, updateTask, deleteTask };
}

export function useInbox() {
  initDemoData();
  const [inbox, setInbox] = useState<InboxItem[]>(() => loadFromStorage<InboxItem[]>(STORAGE_KEYS.inbox, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.inbox, inbox); }, [inbox]);
  const addInboxItem = useCallback((item: InboxItem) => { setInbox((prev) => [item, ...prev]); }, []);
  const removeInboxItem = useCallback((id: string) => { setInbox((prev) => prev.filter((i) => i.id !== id)); }, []);
  return { inbox, addInboxItem, removeInboxItem };
}

export function useSettings() {
  initDemoData();
  const [settings, setSettingsState] = useState<AppSettings>(() => loadFromStorage<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  useEffect(() => { saveToStorage(STORAGE_KEYS.settings, settings); }, [settings]);
  const setSettings = useCallback((updates: Partial<AppSettings>) => { setSettingsState((prev) => ({ ...prev, ...updates })); }, []);
  return { settings, setSettings };
}

export function useCustomCategories() {
  initDemoData();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => loadFromStorage<CustomCategory[]>(STORAGE_KEYS.customCategories, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.customCategories, customCategories); }, [customCategories]);
  const addCustomCategory = useCallback((cat: CustomCategory) => { setCustomCategories((prev) => [...prev, cat]); }, []);
  const deleteCustomCategory = useCallback((id: string) => { setCustomCategories((prev) => prev.filter((c) => c.id !== id)); }, []);
  return { customCategories, addCustomCategory, deleteCustomCategory };
}

export function useFinances() {
  initDemoData();
  const [finances, setFinances] = useState<FinanceEntry[]>(() => loadFromStorage<FinanceEntry[]>(STORAGE_KEYS.finances, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.finances, finances); }, [finances]);
  const addFinance = useCallback((entry: FinanceEntry) => { setFinances((prev) => [entry, ...prev]); }, []);
  const updateFinance = useCallback((id: string, updates: Partial<FinanceEntry>) => { setFinances((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f))); }, []);
  const deleteFinance = useCallback((id: string) => { setFinances((prev) => prev.filter((f) => f.id !== id)); }, []);
  return { finances, addFinance, updateFinance, deleteFinance };
}

export function useBudgets() {
  initDemoData();
  const [budgets, setBudgets] = useState<Budget[]>(() => loadFromStorage<Budget[]>(STORAGE_KEYS.budgets, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.budgets, budgets); }, [budgets]);
  const addBudget = useCallback((budget: Budget) => { setBudgets((prev) => [...prev, budget]); }, []);
  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => { setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b))); }, []);
  const deleteBudget = useCallback((id: string) => { setBudgets((prev) => prev.filter((b) => b.id !== id)); }, []);
  return { budgets, addBudget, updateBudget, deleteBudget };
}

export function useFamilyMembers() {
  initDemoData();
  const [members, setMembers] = useState<FamilyMember[]>(() => loadFromStorage<FamilyMember[]>(STORAGE_KEYS.familyMembers, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.familyMembers, members); }, [members]);
  const addMember = useCallback((m: FamilyMember) => { setMembers((prev) => [...prev, m]); }, []);
  const updateMember = useCallback((id: string, updates: Partial<FamilyMember>) => { setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m))); }, []);
  const deleteMember = useCallback((id: string) => { setMembers((prev) => prev.filter((m) => m.id !== id)); }, []);
  return { members, addMember, updateMember, deleteMember };
}

export function useDebtCases() {
  initDemoData();
  const [cases, setCases] = useState<DebtCase[]>(() => loadFromStorage<DebtCase[]>(STORAGE_KEYS.debtCases, []));
  useEffect(() => { saveToStorage(STORAGE_KEYS.debtCases, cases); }, [cases]);

  const addCase = useCallback((c: DebtCase) => { setCases((prev) => [c, ...prev]); }, []);
  const updateCase = useCallback((id: string, updates: Partial<DebtCase>) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));
  }, []);
  const deleteCase = useCallback((id: string) => { setCases((prev) => prev.filter((c) => c.id !== id)); }, []);

  const addNote = useCallback((caseId: string, note: { id: string; content: string; createdAt: string }) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, notes: [...c.notes, note], updatedAt: new Date().toISOString() } : c)));
  }, []);

  const linkDocument = useCallback((caseId: string, docId: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId && !c.documentIds.includes(docId) ? { ...c, documentIds: [...c.documentIds, String(docId)] } : c)));
  }, []);

  const unlinkDocument = useCallback((caseId: string, docId: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, documentIds: c.documentIds.filter((d) => d !== docId) } : c)));
  }, []);

  const addCommunication = useCallback((caseId: string, comm: { id: string; type: 'letter' | 'email' | 'phone' | 'meeting' | 'sms' | 'other'; direction: 'sent' | 'received'; date: string; description: string; documentIds: string[] }) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, communications: [...c.communications, comm], updatedAt: new Date().toISOString() } : c)));
  }, []);

  const closeCase = useCallback((caseId: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: 'closed' as const, closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c)));
  }, []);

  return { cases, addCase, updateCase, deleteCase, addNote, addCommunication, linkDocument, unlinkDocument, closeCase };
}
