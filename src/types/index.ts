export type TaskCategory = 'invoice' | 'signature' | 'scan' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'new' | 'in_progress' | 'done' | 'archived';
export type FileType = 'pdf' | 'image' | 'doc';
export type CalendarView = 'month' | 'week' | 'list';
export type AppTheme = 'dark' | 'light';
export type AppView = 'dashboard' | 'documents' | 'tasks' | 'inbox' | 'calendar' | 'finances' | 'bankStatements' |  'bankAccounts' |'debts' | 'family';
export type TransactionType = 'income' | 'expense';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export type DebtCaseStatus = 'open' | 'negotiating' | 'payment_plan' | 'legal' | 'resolved' | 'closed';
export type DebtCasePriority = 'critical' | 'high' | 'medium' | 'low';

export interface Document {
  id: string;
  name: string;
  category: string;
  date: string;
  size: number;
  amount?: number | null;
  type: FileType;
  tags: string[];
  notes: string;
  fileData?: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  notes: string;
}

export interface InboxItem {
  id: string;
  name: string;
  date: string;
  size: number;
  type: FileType;
  fileData?: string;
}

export interface AppSettings {
  theme: AppTheme;
  language: string;
  lastVisited: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface FinanceEntry {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  status: InvoiceStatus;
  notes: string;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly';
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface DebtCase {
  id: string;
  title: string;
  creditor: string;
  originalAmount: number;
  currentAmount: number;
  status: DebtCaseStatus;
  priority: DebtCasePriority;
  memberId: string | null;
  documentIds: string[];
  notes: DebtNote[];
  communications: CommunicationEntry[];
  interestRate: number | null;
  dueDate: string | null;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export type CommunicationType = 'letter' | 'email' | 'phone' | 'meeting' | 'sms' | 'other';
export type CommunicationDirection = 'sent' | 'received';

export interface CommunicationEntry {
  id: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  date: string;
  description: string;
  documentIds: string[];
}

export interface DebtNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  color: string;
  notes: string;
  dateOfBirth: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}
