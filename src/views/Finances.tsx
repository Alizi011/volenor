import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Receipt,
  Target,
} from 'lucide-react';
import type { FinanceEntry, Budget, CategoryConfig } from '../types';
import Header from '../components/Header';
import FinanceBills from './FinanceBills';

interface FinancesProps {
  finances: FinanceEntry[];
  budgets: Budget[];
  categories: CategoryConfig[];
  financialItems: any[];
  onAddFinance: (entry: FinanceEntry) => void;
  onUpdateFinance: (id: string, updates: Partial<FinanceEntry>) => void;
  onDeleteFinance: (id: string) => void;
  onAddBudget: (budget: Budget) => void;
  onAddFinancialItem: (item: any) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
  onMarkFinancialItemAsPaid: (input: { id: number; amount?: number | null }) => void;
}

const STATUS_CONFIG = {
  paid: { label: 'Betalt', color: 'var(--accent-green)', icon: CheckCircle2 },
  pending: { label: 'Venter', color: 'var(--accent-orange)', icon: Clock },
  overdue: { label: 'Forfalt', color: 'var(--accent-red)', icon: AlertTriangle },
};

const FINANCE_CATEGORIES: CategoryConfig[] = [
  { id: 'income', label: 'Inntekt', icon: 'Wallet', color: '#4ade80' },
  { id: 'expense', label: 'Diverse utgifter', icon: 'CreditCard', color: '#fb923c' },
];

export default function Finances({
  finances,
  financialItems,
  budgets,
  categories,
  onAddFinance,
  onAddFinancialItem,
  onMarkFinancialItemAsPaid,
  onDeleteFinance,
  addToast,
}: FinancesProps) {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [financeView, setFinanceView] = useState<'overview' | 'bills'>('overview');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('invoices');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');
  const [newNotes, setNewNotes] = useState('');
  const [newRecurring, setNewRecurring] = useState(false);

  // Combine default categories with custom ones for finance use
  const allCategories = useMemo(() => {
    const defaultFinanceCats = [...categories, ...FINANCE_CATEGORIES];
    return defaultFinanceCats;
  }, [categories]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthEntries = finances.filter((f) => f.date.startsWith(selectedMonth));
    const income = monthEntries.filter((f) => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const expenses = monthEntries.filter((f) => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const pendingExpenses = monthEntries
      .filter((f) => f.type === 'expense' && f.status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0);
    const overdueExpenses = monthEntries
      .filter((f) => f.type === 'expense' && f.status === 'overdue')
      .reduce((sum, f) => sum + f.amount, 0);
    return { income, expenses, balance: income - expenses, pendingExpenses, overdueExpenses, count: monthEntries.length };
  }, [finances, selectedMonth]);


  // Previous month comparison
  const prevMonthStats = useMemo(() => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    const prevMonth = d.toISOString().slice(0, 7);
    const monthEntries = finances.filter((f) => f.date.startsWith(prevMonth));
    const income = monthEntries.filter((f) => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const expenses = monthEntries.filter((f) => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    return { income, expenses };
  }, [finances, selectedMonth]);

  // Expenses by category for current month
  const expensesByCategory = useMemo(() => {
    const monthEntries = finances.filter((f) => f.date.startsWith(selectedMonth) && f.type === 'expense');
    const grouped: Record<string, number> = {};
    monthEntries.forEach((f) => {
      grouped[f.category] = (grouped[f.category] || 0) + f.amount;
    });
    return Object.entries(grouped)
      .map(([catId, amount]) => {
        const cat = allCategories.find((c) => c.id === catId);
        return { id: catId, label: cat?.label || catId, color: cat?.color || '#8a8580', amount };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [finances, selectedMonth, allCategories]);

  // Income by category for current month
  const incomeByCategory = useMemo(() => {
    const monthEntries = finances.filter((f) => f.date.startsWith(selectedMonth) && f.type === 'income');
    const grouped: Record<string, number> = {};
    monthEntries.forEach((f) => {
      grouped[f.category] = (grouped[f.category] || 0) + f.amount;
    });
    return Object.entries(grouped)
      .map(([catId, amount]) => {
        const cat = allCategories.find((c) => c.id === catId);
        return { id: catId, label: cat?.label || catId, color: cat?.color || '#8a8580', amount };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [finances, selectedMonth, allCategories]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let filtered = finances.filter((f) => f.date.startsWith(selectedMonth));
    if (filterType !== 'all') {
      filtered = filtered.filter((f) => f.type === filterType);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finances, selectedMonth, filterType]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    return budgets.map((budget) => {
      const spent = finances
        .filter((f) => f.date.startsWith(selectedMonth) && f.type === 'expense' && f.category === budget.category)
        .reduce((sum, f) => sum + f.amount, 0);
      const cat = allCategories.find((c) => c.id === budget.category);
      return {
        ...budget,
        spent,
        percentage: budget.monthlyLimit > 0 ? Math.min(100, Math.round((spent / budget.monthlyLimit) * 100)) : 0,
        label: cat?.label || budget.category,
        color: cat?.color || '#8a8580',
      };
    }).filter((b) => b.monthlyLimit > 0);
  }, [budgets, finances, selectedMonth, allCategories]);

  // Monthly history for chart (last 6 months)
  const monthlyHistory = useMemo(() => {
    const months: { month: string; label: string; income: number; expense: number }[] = [];
    const d = new Date(selectedMonth + '-01');
    for (let i = 5; i >= 0; i--) {
      const md = new Date(d);
      md.setMonth(md.getMonth() - i);
      const m = md.toISOString().slice(0, 7);
      const entries = finances.filter((f) => f.date.startsWith(m));
      const income = entries.filter((f) => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      const expense = entries.filter((f) => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      months.push({
        month: m,
        label: md.toLocaleDateString('nb-NO', { month: 'short' }),
        income,
        expense,
      });
    }
    return months;
  }, [finances, selectedMonth]);

  const maxHistoryValue = Math.max(...monthlyHistory.map((m) => Math.max(m.income, m.expense)), 1);

  const handleAddEntry = () => {
    if (!newTitle.trim() || !newAmount) return;
    const amount = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    onAddFinance({
      id: Math.random().toString(36).substring(2, 11),
      title: newTitle,
      amount,
      type: newType,
      category: newCategory,
      date: newDate,
      status: newStatus,
      notes: newNotes,
      isRecurring: newRecurring,
      recurringInterval: newRecurring ? 'monthly' : undefined,
    });

    addToast('success', `${newType === 'income' ? 'Inntekt' : 'Utgift'} lagt til`);
    setNewTitle('');
    setNewAmount('');
    setNewNotes('');
    setNewRecurring(false);
    setShowNewEntry(false);
  };

  const formatNOK = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);
  };

  const incomeChange = prevMonthStats.income > 0 ? ((monthlyStats.income - prevMonthStats.income) / prevMonthStats.income) * 100 : 0;
  const expenseChange = prevMonthStats.expenses > 0 ? ((monthlyStats.expenses - prevMonthStats.expenses) / prevMonthStats.expenses) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="FINANS" />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Month selector */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={() => setShowNewEntry(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium ml-auto"
            style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
          >
            <Plus size={16} />
            Ny transaksjon
          </button>
        </div>

       {/* Finance view tabs */}
<div className="flex gap-2 mb-6">
  {([
    { value: 'overview', label: 'Oversikt' },
    { value: 'bills', label: 'Regninger & krav' },
  ] as const).map((tab) => (
    <button
      key={tab.value}
      onClick={() => setFinanceView(tab.value)}
      className="px-4 py-2 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: financeView === tab.value ? 'var(--accent-yellow)' : 'var(--bg-secondary)',
        color: financeView === tab.value ? '#0a0a0a' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {tab.label}
    </button>
  ))}
</div>

{financeView === 'bills' && (
  <FinanceBills
    finances={finances}
    financialItems={financialItems}
    onAddFinancialItem={onAddFinancialItem}
    onMarkFinancialItemAsPaid={onMarkFinancialItemAsPaid}
  />
)}
  
  {financeView === 'overview' && (
  <>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Inntekter',
              value: formatNOK(monthlyStats.income),
              change: incomeChange,
              icon: TrendingUp,
              color: 'var(--accent-green)',
            },
            {
              label: 'Utgifter',
              value: formatNOK(monthlyStats.expenses),
              change: expenseChange,
              icon: TrendingDown,
              color: 'var(--accent-red)',
            },
            {
              label: 'Balanse',
              value: formatNOK(monthlyStats.balance),
              change: null,
              icon: Wallet,
              color: monthlyStats.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            },
            {
              label: 'Venter / Forfalt',
              value: formatNOK(monthlyStats.pendingExpenses + monthlyStats.overdueExpenses),
              sub: `${monthlyStats.overdueExpenses > 0 ? formatNOK(monthlyStats.overdueExpenses) + ' forfalt' : ''}`,
              change: null,
              icon: AlertTriangle,
              color: 'var(--accent-orange)',
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <card.icon size={18} style={{ color: card.color }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {card.label}
                </span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              {card.change !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {card.change >= 0 ? (
                    <ArrowUpRight size={14} style={{ color: 'var(--accent-green)' }} />
                  ) : (
                    <ArrowDownRight size={14} style={{ color: 'var(--accent-red)' }} />
                  )}
                  <span className="text-xs" style={{ color: card.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}% vs forrige mnd
                  </span>
                </div>
              )}
              {card.sub && (
                <div className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>
                  {card.sub}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly history chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Siste 6 måneder
            </h3>
            <div className="flex items-end gap-3 h-40">
              {monthlyHistory.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: '120px' }}>
                    <div
                      className="flex-1 rounded-t-md transition-all"
                      style={{
                        height: `${(m.income / maxHistoryValue) * 100}%`,
                        backgroundColor: 'var(--accent-green)',
                        minHeight: m.income > 0 ? '4px' : '0',
                      }}
                      title={`Inntekt: ${formatNOK(m.income)}`}
                    />
                    <div
                      className="flex-1 rounded-t-md transition-all"
                      style={{
                        height: `${(m.expense / maxHistoryValue) * 100}%`,
                        backgroundColor: 'var(--accent-red)',
                        minHeight: m.expense > 0 ? '4px' : '0',
                      }}
                      title={`Utgift: ${formatNOK(m.expense)}`}
                    />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--accent-green)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Inntekt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--accent-red)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Utgift</span>
              </div>
            </div>
          </motion.div>

          {/* Budget progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} style={{ color: 'var(--accent-yellow)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Budsjett
              </h3>
            </div>
            {budgetProgress.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ingen budsjett satt</p>
            ) : (
              <div className="space-y-4">
                {budgetProgress.map((b) => (
                  <div key={b.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatNOK(b.spent)} / {formatNOK(b.monthlyLimit)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${b.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: b.percentage > 90 ? 'var(--accent-red)' : b.percentage > 70 ? 'var(--accent-orange)' : b.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Expenses and Income by category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Utgifter per kategori
            </h3>
            {expensesByCategory.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ingen utgifter denne måneden</p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatNOK(cat.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Inntekter per kategori
            </h3>
            {incomeByCategory.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ingen inntekter denne måneden</p>
            ) : (
              <div className="space-y-3">
                {incomeByCategory.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatNOK(cat.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Transaction list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Transaksjoner
            </h3>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {([
                { value: 'all', label: 'Alle' },
                { value: 'income', label: 'Inntekt' },
                { value: 'expense', label: 'Utgift' },
              ] as const).map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: filterType === f.value ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                    color: filterType === f.value ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                    borderRight: '1px solid var(--border-color)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              Ingen transaksjoner denne måneden
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => {
                const cat = allCategories.find((c) => c.id === entry.category);
                const StatusIcon = STATUS_CONFIG[entry.status].icon;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat?.color || '#8a8580'}20` }}
                    >
                      {entry.type === 'income' ? (
                        <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
                      ) : (
                        <Receipt size={18} style={{ color: cat?.color || 'var(--text-secondary)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {cat?.label || entry.category}
                        </span>
                        {entry.isRecurring && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            {entry.recurringInterval === 'monthly' ? 'Månedlig' : entry.recurringInterval === 'quarterly' ? 'Kvartalsvis' : 'Årlig'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: entry.type === 'income' ? 'var(--accent-green)' : 'var(--text-primary)' }}
                      >
                        {entry.type === 'income' ? '+' : '-'}{formatNOK(entry.amount)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <StatusIcon size={12} style={{ color: STATUS_CONFIG[entry.status].color }} />
                        <span className="text-xs" style={{ color: STATUS_CONFIG[entry.status].color }}>
                          {STATUS_CONFIG[entry.status].label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDeleteFinance(entry.id);
                        addToast('info', 'Transaksjon slettet');
                      }}
                      className="p-1.5 rounded-lg transition-colors shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          </motion.div>

      </>
    )}
      </div>
     

        /* New entry modal */
      <AnimatePresence>
        {showNewEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowNewEntry(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-full max-w-lg rounded-2xl p-8 pointer-events-auto max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Ny transaksjon
                  </h2>
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="p-1 rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Type toggle */}
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                    {(['expense', 'income'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className="flex-1 py-2 text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: newType === t ? (t === 'income' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)') : 'transparent',
                          color: newType === t ? (t === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-secondary)',
                        }}
                      >
                        {t === 'income' ? 'Inntekt' : 'Utgift'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Beskrivelse</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Hva er transaksjonen?"
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Beløp (kr)</label>
                      <input
                        type="text"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Dato</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Kategori</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        <optgroup label="Standard">
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Annet">
                          {FINANCE_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as 'paid' | 'pending' | 'overdue')}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        <option value="paid">Betalt</option>
                        <option value="pending">Venter</option>
                        <option value="overdue">Forfalt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Notater</label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Valgfrie notater..."
                      className="w-full rounded-lg px-3 py-3 text-sm outline-none resize-none"
                      rows={2}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRecurring}
                      onChange={(e) => setNewRecurring(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Gjentakende (månedlig)</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleAddEntry}
                    className="flex-1 h-10 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
                  >
                    Lagre
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
