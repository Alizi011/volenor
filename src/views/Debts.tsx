import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  Plus,
  X,
  FileText,
  Paperclip,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CircleDot,
  Send,
  Users,
  Link as LinkIcon,
  Mail,
  Phone,
  Smartphone,
  History,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
Eye,
Trash2,
} from 'lucide-react';

import type { DebtCase, DebtCaseStatus, DebtCasePriority, FamilyMember, Document, CommunicationType } from '../types';
import { generateId } from '../data/demoData';
import Header from '../components/Header';

interface DebtsProps {
  cases: DebtCase[];
  members: FamilyMember[];
  documents: Document[];
  onAddCase: (c: DebtCase) => void;
  onUpdateCase: (id: string, updates: Partial<DebtCase>) => void;
  onDeleteCase: (id: string) => void;
  onAddNote: (caseId: string, note: { id: string; content: string; createdAt: string }) => void;
  onAddCommunication: (caseId: string, comm: { id: string; type: CommunicationType; direction: 'sent' | 'received'; date: string; description: string; documentIds: string[] }) => void;
  onLinkDocument: (caseId: string, docId: string) => void;
  onUnlinkDocument: (caseId: string, docId: string) => void;
  onCloseCase: (caseId: string) => void;
  onOpenCase: (caseId: number) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

const STATUS_CONFIG: Record<DebtCaseStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Åpen', color: 'var(--accent-orange)', icon: CircleDot },
  negotiating: { label: 'I forhandling', color: 'var(--accent-blue)', icon: MessageSquare },
  payment_plan: { label: 'Nedbetaling', color: 'var(--accent-green)', icon: Clock },
  legal: { label: 'Rettslig', color: 'var(--accent-red)', icon: Gavel },
  resolved: { label: 'Løst', color: 'var(--accent-green)', icon: CheckCircle2 },
  closed: { label: 'Lukket', color: 'var(--text-secondary)', icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<DebtCasePriority, { label: string; color: string }> = {
  critical: { label: 'Kritisk', color: 'var(--accent-red)' },
  high: { label: 'Høy', color: 'var(--accent-orange)' },
  medium: { label: 'Middels', color: 'var(--accent-yellow)' },
  low: { label: 'Lav', color: 'var(--accent-green)' },
};

const COMM_TYPE_CONFIG: Record<CommunicationType, { label: string; icon: React.ElementType; color: string }> = {
  letter: { label: 'Brev', icon: FileText, color: 'var(--accent-orange)' },
  email: { label: 'E-post', icon: Mail, color: 'var(--accent-blue)' },
  phone: { label: 'Telefon', icon: Phone, color: 'var(--accent-green)' },
  meeting: { label: 'Møte', icon: Users, color: 'var(--accent-yellow)' },
  sms: { label: 'SMS', icon: Smartphone, color: 'var(--accent-red)' },
  other: { label: 'Annet', icon: CircleDot, color: 'var(--text-secondary)' },
};

export default function Debts({
  cases, members, documents,
  onAddCase, onUpdateCase, onDeleteCase, onAddNote, onAddCommunication,
  onLinkDocument, onUnlinkDocument, onCloseCase, onOpenCase, addToast,
}: DebtsProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [showNewCase, setShowNewCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DebtCase | null>(null);
  const [showLinkDocs, setShowLinkDocs] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents'>('timeline');

  // Communication form
  const [showCommForm, setShowCommForm] = useState(false);
  const [commType, setCommType] = useState<CommunicationType>('letter');
  const [commDirection, setCommDirection] = useState<'sent' | 'received'>('received');
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 10));
  const [commDesc, setCommDesc] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCreditor, setFormCreditor] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMember, setFormMember] = useState('');
  const [formPriority, setFormPriority] = useState<DebtCasePriority>('medium');
  const [formRef, setFormRef] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => (filterStatus === 'all' ? true : c.status === filterStatus))
      .filter((c) => (filterMember === 'all' ? true : c.memberId === filterMember))
      .sort((a, b) => {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [cases, filterStatus, filterMember]);

  const stats = useMemo(() => {
    const open = cases.filter((c) => c.status !== 'closed' && c.status !== 'resolved');
    return {
      total: cases.length,
      active: open.length,
      critical: open.filter((c) => c.priority === 'critical').length,
      totalDebt: open.reduce((s, c) => s + c.currentAmount, 0),
    };
  }, [cases]);

  const handleAddCase = () => {
    if (!formTitle.trim() || !formCreditor.trim() || !formAmount) return;
    const amount = Math.round(parseFloat(formAmount.replace(',', '.')) * 100);
    if (isNaN(amount) || amount <= 0) return;

    onAddCase({
      id: generateId(),
      title: formTitle,
      creditor: formCreditor,
      originalAmount: amount,
      currentAmount: amount,
      status: 'open',
      priority: formPriority,
      memberId: formMember || null,
      documentIds: [],
      notes: [],
      communications: [],
      interestRate: formInterest ? parseFloat(formInterest) : null,
      dueDate: formDueDate || null,
      referenceNumber: formRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
    });
    addToast('success', 'Sak opprettet');
    setFormTitle(''); setFormCreditor(''); setFormAmount(''); setFormRef(''); setFormInterest(''); setFormDueDate(''); setFormMember('');
    setShowNewCase(false);
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedCase) return;
    onAddNote(selectedCase.id, {
      id: generateId(),
      content: noteText,
      createdAt: new Date().toISOString(),
    });
    setNoteText('');
    // Refresh selectedCase
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
    addToast('info', 'Notat lagt til');
  };

  const handleLinkDoc = (docId: string) => {
    if (!selectedCase) return;
    onLinkDocument(selectedCase.id, docId);
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
    setShowLinkDocs(false);
    addToast('success', 'Dokument koblet');
  };

  const handleCloseCase = () => {
    if (!selectedCase) return;
    onCloseCase(selectedCase.id);
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
    addToast('success', 'Sak lukket');
  };

  const handleAddCommunication = () => {
    if (!commDesc.trim() || !selectedCase) return;
    onAddCommunication(selectedCase.id, {
      id: generateId(),
      type: commType,
      direction: commDirection,
      date: commDate ? `${commDate}T12:00:00` : new Date().toISOString(),
      description: commDesc,
      documentIds: [],
    });
    setCommDesc('');
    setShowCommForm(false);
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
    addToast('success', 'Henvendelse registrert');
  };

  const getMemberName = (id: string | null) => {
    if (!id) return 'Meg selv';
    return members.find((m) => m.id === id)?.name || 'Ukjent';
  };

  const formatNOK = (amount: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount / 100);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="GJELD OG INKASSO" />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Aktive saker', value: stats.active, icon: AlertTriangle, color: 'var(--accent-orange)' },
            { label: 'Kritiske', value: stats.critical, icon: AlertCircle, color: 'var(--accent-red)' },
            { label: 'Gjeld totalt', value: formatNOK(stats.totalDebt), icon: Gavel, color: 'var(--text-primary)' },
            { label: 'Totalt antall', value: stats.total, icon: FileText, color: 'var(--accent-blue)' },
          ].map((s, i) => (
            <motion.div key={s.label}
            
            initial={{ opacity: 0, y: 20 }} 
            
            animate={{ opacity: 1, y: 0 }} 
            
            transition={{ delay: i * 0.08 }}

              className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters + New */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="all">Alle status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="all">Alle personer</option>
            <option value="me">Meg selv</option>
            {members.filter((m) => m.id !== 'me').map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
          <button onClick={() => setShowNewCase(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium ml-auto"
            style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>
            <Plus size={16} /> Ny sak
          </button>
        </div>

        {/* Cases list */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredCases.map((c, i) => {
              const StatusIcon = STATUS_CONFIG[c.status].icon;
              const progress = c.originalAmount > 0 ? Math.round(((c.originalAmount - c.currentAmount) / c.originalAmount) * 100) : 0;
              
              return (
                <motion.div key={c.id ?? `debt-case-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-5 cursor-pointer transition-all duration-200" style={{ backgroundColor: 'var(--bg-secondary)' }}
                  onClick={() => onOpenCase(Number(c.id))}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${PRIORITY_CONFIG[c.priority].color}20` }}>
                        <StatusIcon size={20} style={{ color: PRIORITY_CONFIG[c.priority].color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.creditor} · Ref: {c.referenceNumber}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: `${STATUS_CONFIG[c.status].color}20`, color: STATUS_CONFIG[c.status].color }}>
                            {STATUS_CONFIG[c.status].label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: `${PRIORITY_CONFIG[c.priority].color}20`, color: PRIORITY_CONFIG[c.priority].color }}>
                            {PRIORITY_CONFIG[c.priority].label}
                          </span>
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Users size={12} /> {getMemberName(c.memberId)}
                          </span>
                          {c.documentIds.length > 0 && (
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <Paperclip size={12} /> {c.documentIds.length}
                            </span>
                          )}
                          {c.notes.length > 0 && (
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <MessageSquare size={12} /> {c.notes.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
              <button
  onClick={(e) => {
    e.stopPropagation();
    onOpenCase(Number(c.id));
  }}
  className="p-1 rounded-lg"
  style={{ color: 'var(--accent-yellow)' }}
  title="Åpne arbeidsområde"
>
  <ArrowUpRight size={16} />
</button>

<button
  onClick={(e) => {
    e.stopPropagation();

    if (confirm(`Slette saken "${c.title}"?`)) {
      onDeleteCase(c.id);
      addToast('success', 'Sak slettet');
    }
  }}
  className="p-1 rounded-lg"
  style={{ color: 'var(--accent-red)' }}
  title="Slett sak"
>
  <Trash2 size={16} />
</button>

                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNOK(c.currentAmount)}
                </p>

                {c.currentAmount < c.originalAmount && (
                  <p
                    className="text-xs"
                    style={{ color: 'var(--accent-green)' }}
                  >
                    {formatNOK(c.originalAmount - c.currentAmount)} nedbetalt
                  </p>
                )}
              </div>
                  </div>

                  {/* Progress bar */}
                  {c.status !== 'closed' && c.status !== 'resolved' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Nedbetalt</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full rounded-full" style={{ backgroundColor: progress > 75 ? 'var(--accent-green)' : progress > 40 ? 'var(--accent-yellow)' : 'var(--accent-orange)' }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredCases.length === 0 && (
            <div className="text-center py-16 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Gavel size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Ingen saker funnet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Opprett en ny sak for å komme i gang</p>
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      <AnimatePresence>
        {showNewCase && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowNewCase(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-lg rounded-2xl p-8 pointer-events-auto max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Ny gjeldssak</h2>
                  <button onClick={() => setShowNewCase(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Beskrivelse</label>
                    <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="F.eks. Kredittkortgjeld, Inkasso..."
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Kreditor</label>
                      <input value={formCreditor} onChange={(e) => setFormCreditor(e.target.value)} placeholder="Bank, inkassoselskap..."
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Beløp (kr)</label>
                      <input value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0,00"
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Hvem gjelder det?</label>
                      <select value={formMember} onChange={(e) => setFormMember(e.target.value)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <option value="">Meg selv</option>
                        {members.filter((m) => m.id !== 'me').map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Prioritet</label>
                      <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as DebtCasePriority)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <option value="critical">Kritisk</option>
                        <option value="high">Høy</option>
                        <option value="medium">Middels</option>
                        <option value="low">Lav</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Referansenummer</label>
                      <input value={formRef} onChange={(e) => setFormRef(e.target.value)} placeholder="Valgfritt"
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Rente (%)</label>
                      <input value={formInterest} onChange={(e) => setFormInterest(e.target.value)} placeholder="Valgfritt"
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Forfallsdato (valgfritt)</label>
                    <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowNewCase(false)} className="flex-1 h-10 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Avbryt</button>
                  <button onClick={handleAddCase} className="flex-1 h-10 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>Opprett sak</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Case Detail Panel */}
      <AnimatePresence>
        {selectedCase && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedCase(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-[680px] max-w-full z-[120] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCase.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: `${STATUS_CONFIG[selectedCase.status].color}20`, color: STATUS_CONFIG[selectedCase.status].color }}>
                    {STATUS_CONFIG[selectedCase.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCase.status !== 'closed' && selectedCase.status !== 'resolved' && (
                    <button onClick={handleCloseCase} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--accent-green)', color: '#0a0a0a' }}>
                      <CheckCircle2 size={14} /> Lukk sak
                    </button>
                  )}
                  <button onClick={() => setSelectedCase(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Opprinnelig beløp</span>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatNOK(selectedCase.originalAmount)}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gjenstående</span>
                    <p className="text-lg font-semibold" style={{ color: selectedCase.currentAmount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{formatNOK(selectedCase.currentAmount)}</p>
                  </div>
                </div>

                {/* Compact details */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Kreditor</span><span style={{ color: 'var(--text-primary)' }}>{selectedCase.creditor}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Ref.nr</span><span style={{ color: 'var(--text-primary)' }}>{selectedCase.referenceNumber}</span></div>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Angår</span><span style={{ color: 'var(--text-primary)' }}>{getMemberName(selectedCase.memberId)}</span></div>
                  {selectedCase.interestRate !== null && <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Rente</span><span style={{ color: 'var(--text-primary)' }}>{selectedCase.interestRate}%</span></div>}
                  {selectedCase.dueDate && <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Forfallsdato</span><span style={{ color: 'var(--text-primary)' }}>{formatDate(selectedCase.dueDate)}</span></div>}
                  <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Opprettet</span><span style={{ color: 'var(--text-primary)' }}>{formatDate(selectedCase.createdAt)}</span></div>
                </div>

                {/* Status change */}
                {selectedCase.status !== 'closed' && (
                  <div>
                    <span className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>Endre status</span>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATUS_CONFIG) as DebtCaseStatus[]).map((s) => (
                        <button key={s} onClick={() => { onUpdateCase(selectedCase.id, { status: s }); const updated = cases.find((c) => c.id === selectedCase.id); if (updated) setSelectedCase({ ...updated, status: s }); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ backgroundColor: selectedCase.status === s ? `${STATUS_CONFIG[s].color}20` : 'var(--bg-tertiary)', color: selectedCase.status === s ? STATUS_CONFIG[s].color : 'var(--text-secondary)', border: selectedCase.status === s ? `1px solid ${STATUS_CONFIG[s].color}` : '1px solid var(--border-color)' }}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <button onClick={() => setActiveTab('timeline')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors"
                    style={{ backgroundColor: activeTab === 'timeline' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'timeline' ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>
                    <History size={14} /> Tidslinje ({selectedCase.communications.length + selectedCase.notes.length + selectedCase.documentIds.length + 1})
                  </button>
                  <button onClick={() => setActiveTab('documents')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors"
                    style={{ backgroundColor: activeTab === 'documents' ? 'var(--bg-secondary)' : 'transparent', color: activeTab === 'documents' ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>
                    <FileText size={14} /> Dokumenter ({selectedCase.documentIds.length})
                  </button>
                </div>

                {activeTab === 'timeline' && (
                  <div className="space-y-0">
                    {/* Timeline */}
                    <div className="relative pl-6">
                      {/* Vertical line */}
                      <div className="absolute left-[9px] top-0 bottom-0 w-[2px]" style={{ backgroundColor: 'var(--border-color)' }} />

                      {/* Case creation */}
                      <div className="relative pb-5">
                        <div className="absolute left-[-18px] w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-yellow)' }}>
                          <Archive size={12} style={{ color: '#0a0a0a' }} />
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          <p className="text-xs font-medium" style={{ color: 'var(--accent-yellow)' }}>Sak opprettet</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(selectedCase.createdAt)} · {selectedCase.creditor} · {formatNOK(selectedCase.originalAmount)}</p>
                        </div>
                      </div>

                      {/* Communications + Notes merged and sorted */}
                      {[...selectedCase.communications, ...selectedCase.notes.map((n) => ({ ...n, _isNote: true as const, date: n.createdAt, description: n.content }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => {
                        const isNote = '_isNote' in item;
                        if (isNote) {
                          return (
                            <div key={item.id ?? `note-${index}`} className="relative pb-5">
                              <div className="absolute left-[-18px] w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)', border: '2px solid var(--border-color)' }}>
                                <MessageSquare size={10} style={{ color: 'var(--text-secondary)' }} />
                              </div>
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.description}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(item.createdAt)}</p>
                              </div>
                            </div>
                          );
                        }
                        const comm = item as typeof selectedCase.communications[0];
                        const CommIcon = COMM_TYPE_CONFIG[comm.type].icon;
                        return (
                          <div key={comm.id ?? `comm-${index}`} className="relative pb-5">
                            <div className="absolute left-[-18px] w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COMM_TYPE_CONFIG[comm.type].color}30`, border: `2px solid ${COMM_TYPE_CONFIG[comm.type].color}` }}>
                              <CommIcon size={10} style={{ color: COMM_TYPE_CONFIG[comm.type].color }} />
                            </div>
                            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)', borderLeft: `3px solid ${COMM_TYPE_CONFIG[comm.type].color}` }}>
                              <div className="flex items-center gap-2 mb-1">
                                <CommIcon size={14} style={{ color: COMM_TYPE_CONFIG[comm.type].color }} />
                                <span className="text-xs font-medium" style={{ color: COMM_TYPE_CONFIG[comm.type].color }}>{COMM_TYPE_CONFIG[comm.type].label}</span>
                                {comm.direction === 'sent' ? (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent-blue)' }}><ArrowUpRight size={10} /> Sendt</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent-orange)' }}><ArrowDownLeft size={10} /> Mottatt</span>
                                )}
                              </div>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{comm.description}</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(comm.date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick note input */}
                    {selectedCase.status !== 'closed' && (
                      <div className="mt-4 space-y-3">
                        <div className="flex gap-2">
                          <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                            placeholder="Skriv et notat..." className="flex-1 h-10 rounded-lg px-3 text-sm outline-none"
                            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                          <button onClick={handleAddNote} className="h-10 px-4 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>
                            <Send size={16} />
                          </button>
                        </div>

                        {/* Add communication */}
                        <AnimatePresence>
                          {showCommForm && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                                <h5 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Registrer henvendelse</h5>
                                <div className="grid grid-cols-3 gap-2">
                                  <select value={commType} onChange={(e) => setCommType(e.target.value as CommunicationType)}
                                    className="h-9 px-2 rounded-lg text-xs outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                    {Object.entries(COMM_TYPE_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                                  </select>
                                  <select value={commDirection} onChange={(e) => setCommDirection(e.target.value as 'sent' | 'received')}
                                    className="h-9 px-2 rounded-lg text-xs outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                    <option value="received">Mottatt</option>
                                    <option value="sent">Sendt</option>
                                  </select>
                                  <input type="date" value={commDate} onChange={(e) => setCommDate(e.target.value)}
                                    className="h-9 px-2 rounded-lg text-xs outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                                </div>
                                <textarea value={commDesc} onChange={(e) => setCommDesc(e.target.value)} placeholder="Beskrivelse av henvendelsen..."
                                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={2}
                                  style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                                <div className="flex gap-2">
                                  <button onClick={() => setShowCommForm(false)} className="flex-1 h-8 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Avbryt</button>
                                  <button onClick={handleAddCommunication} className="flex-1 h-8 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>Lagre</button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button onClick={() => setShowCommForm(!showCommForm)} className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs transition-colors"
                          style={{ border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                          <Plus size={14} /> Registrer henvendelse
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Dokumenter i saken</h4>
                      <button onClick={() => setShowLinkDocs(!showLinkDocs)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        <LinkIcon size={12} /> Koble dokument
                      </button>
                    </div>

                    <AnimatePresence>
                      {showLinkDocs && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="rounded-xl p-3 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            {documents.filter((d) => !selectedCase.documentIds.includes(d.id)).length === 0 ? (
                              <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>Ingen ubrukte dokumenter</p>
                            ) : (
                              documents.filter((d) => !selectedCase.documentIds.includes(d.id)).map((d) => (
                                <button key={d.id} onClick={() => handleLinkDoc(d.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors"
                                  style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                  <FileText size={14} /> {d.name}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedCase.documentIds.length === 0 ? (
                      <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingen dokumenter koblet til denne saken</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Koble dokumenter fra arkivet for å se dem her</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedCase.documentIds.map((docId) => {
                          const doc = documents.find((d) => d.id === docId);
                          if (!doc) return null;
                          return (
                            <div key={docId} className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-red)20' }}>
                                <FileText size={20} style={{ color: '#f87171' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(doc.date)} · {(doc.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }} title="Forhåndsvis"><Eye size={14} /></button>
                                <button onClick={() => { onUnlinkDocument(selectedCase.id, docId); const updated = cases.find((c) => c.id === selectedCase.id); if (updated) setSelectedCase(updated); }}
                                  className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }} title="Fjern kobling"><X size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
