import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Search,
  Upload,
  CheckSquare,
  Inbox,
  Calendar,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Document, Task, InboxItem, AppView } from '../types';
import { CATEGORIES } from '../data/demoData';
import Header from '../components/Header';

interface DashboardProps {
  documents: Document[];
  tasks: Task[];
  inbox: InboxItem[];
  onNavigate: (view: AppView) => void;
  onUpload: (file: File) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

const cardAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export default function Dashboard({
  documents,
  tasks,
  inbox,
  onNavigate,
  onUpload,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const invoicesThisMonth = documents.filter(
      (d) => d.category === 'invoices' && d.date.startsWith(currentMonth)
    );
    const tasksDone = tasks.filter((t) => t.status === 'done').length;
    const tasksRemaining = tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').length;
    const upcomingDue = tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'archived') return false;
      const due = new Date(t.dueDate);
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 7 && diff >= 0;
    });

    return {
      totalDocs: documents.length,
      invoicesThisMonth: invoicesThisMonth.length,
      invoicesPaid: invoicesThisMonth.filter((d) => d.notes.toLowerCase().includes('betalt')).length,
      tasksDone,
      tasksRemaining,
      upcomingDue: upcomingDue.length,
    };
  }, [documents, tasks]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const docs = documents
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.notes.toLowerCase().includes(q)
      )
      .map((d) => ({ type: 'document' as const, item: d }));
    const taskResults = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.notes.toLowerCase().includes(q)
      )
      .map((t) => ({ type: 'task' as const, item: t }));
    return [...docs, ...taskResults].slice(0, 10);
  }, [searchQuery, documents, tasks]);

  const recentActivity = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [documents]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.id === category)?.color || '#8a8580';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.id === category)?.label || category;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <Header title="VOLENOR" />

      <div className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <div
            className="relative flex items-center rounded-xl h-14 transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Search
              size={20}
              className="absolute left-4"
              style={{ color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(e.target.value.length > 0);
              }}
              placeholder="Søk i dokumenter, gjøremål og notater..."
              className="w-full h-full bg-transparent pl-12 pr-10 text-base outline-none rounded-xl"
              style={{ color: 'var(--text-primary)' }}
              onFocus={(e) => {
                e.currentTarget.parentElement!.style.borderColor = 'var(--accent-yellow)';
                e.currentTarget.parentElement!.style.boxShadow =
                  '0 0 0 3px rgba(232, 255, 71, 0.1)';
                if (searchQuery) setShowResults(true);
              }}
              onBlur={(e) => {
                setTimeout(() => {
                  e.currentTarget.parentElement!.style.borderColor = 'var(--border-color)';
                  e.currentTarget.parentElement!.style.boxShadow = 'none';
                }, 200);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                className="absolute right-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchQuery && (
            <div
              className="absolute top-16 left-0 right-0 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Ingen resultater funnet
                </div>
              ) : (
                searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {result.type === 'document' ? (
                      <FileText size={18} style={{ color: getCategoryColor(result.item.category) }} />
                    ) : (
                      <CheckSquare size={18} style={{ color: 'var(--accent-blue)' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {result.type === 'document' ? result.item.name : result.item.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {result.type === 'document' ? getCategoryLabel(result.item.category) : result.item.category}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {[
            {
              icon: FileText,
              color: 'var(--accent-blue)',
              value: stats.totalDocs,
              label: 'Dokumenter totalt',
              sub: `+${documents.filter((d) => d.date.startsWith(new Date().toISOString().slice(0, 7))).length} denne måneden`,
              onClick: () => onNavigate('documents'),
            },
            {
              icon: Receipt,
              color: 'var(--accent-orange)',
              value: stats.invoicesThisMonth,
              label: 'Fakturaer denne måneden',
              sub: `${stats.invoicesPaid} betalt, ${stats.invoicesThisMonth - stats.invoicesPaid} venter`,
              onClick: () => onNavigate('documents'),
            },
            {
              icon: CheckCircle2,
              color: 'var(--accent-green)',
              value: stats.tasksDone,
              label: 'Gjøremål fullført',
              sub: `${stats.tasksRemaining} gjenstår`,
              onClick: () => onNavigate('tasks'),
            },
            {
              icon: AlertTriangle,
              color: 'var(--accent-red)',
              value: stats.upcomingDue,
              label: 'Forfaller snart',
              sub: 'Innen 7 dager',
              onClick: () => onNavigate('tasks'),
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardAnimation}
              initial="hidden"
              animate="visible"
              onClick={card.onClick}
              className="relative rounded-xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderLeft: `3px solid ${card.color}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <card.icon size={20} style={{ color: card.color }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {card.label}
                </span>
              </div>
              <div className="text-4xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {card.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Inbox alert */}
        {inbox.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 flex items-center justify-between rounded-xl px-5 py-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '4px solid var(--accent-yellow)',
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} style={{ color: 'var(--accent-yellow)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Du har {inbox.length} {inbox.length === 1 ? 'fil' : 'filer'} i innboksen som trenger sortering
              </span>
            </div>
            <button
              onClick={() => onNavigate('inbox')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              Gå til innboks
            </button>
          </motion.div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {[
            { icon: Upload, label: 'Last opp dokument', action: 'upload' },
            { icon: CheckSquare, label: 'Nytt gjøremål', action: 'tasks' },
            { icon: Inbox, label: 'Åpne innboks', action: 'inbox' },
            { icon: Calendar, label: 'Vis kalender', action: 'calendar' },
          ].map((action) => (
            <button
              key={action.label ?? `action-${i}`}
              onClick={() => {
                if (action.action === 'upload') {
                  document.getElementById('dashboard-upload')?.click();
                } else {
                  onNavigate(action.action as AppView);
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-yellow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <action.icon size={18} />
              {action.label}
            </button>
          ))}
          <input
            id="dashboard-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* Recent activity */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Siste aktivitet
          </h2>
          <div className="space-y-3">
            {recentActivity.map((doc, i) => (
              <motion.div
                key={doc.id ?? `recent-doc-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
                onClick={() => onNavigate('documents')}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <FileText size={18} style={{ color: getCategoryColor(doc.category) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {doc.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(doc.date).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-md shrink-0"
                  style={{
                    backgroundColor: `${getCategoryColor(doc.category)}20`,
                    color: getCategoryColor(doc.category),
                  }}
                >
                  {getCategoryLabel(doc.category)}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
