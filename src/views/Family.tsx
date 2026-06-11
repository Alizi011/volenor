import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  X,
  Trash2,
  Gavel,
  Wallet,
  UserCircle,
  CreditCard,
} from 'lucide-react';
import type { FamilyMember, DebtCase, FinanceEntry, Document } from '../types';
import { generateId, AVAILABLE_COLORS } from '../data/demoData';
import Header from '../components/Header';

interface FamilyProps {
  members: FamilyMember[];
  debtCases: DebtCase[];
  finances: FinanceEntry[];
  documents: Document[];
  onAddMember: (m: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

const RELATIONS = ['Ektefelle', 'Samboer', 'Sønn', 'Datter', 'Far', 'Mor', 'Bestefar', 'Bestemor', 'Barnebarn', 'Annet'];

export default function Family({ members, debtCases, finances: _finances, documents, onAddMember, onDeleteMember, addToast }: FamilyProps) {
  void _finances; // reserved for per-member transaction breakdown
  const [showNewMember, setShowNewMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formRelation, setFormRelation] = useState(RELATIONS[0]);
  const [formColor, setFormColor] = useState(AVAILABLE_COLORS[0]);
  const [formDob, setFormDob] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const memberId = m.id;
      const debts = debtCases.filter((d) => d.memberId === memberId);
      const activeDebts = debts.filter((d) => d.status !== 'closed' && d.status !== 'resolved');
      const totalDebt = activeDebts.reduce((s, d) => s + d.currentAmount, 0);
      return { member: m, debtCount: activeDebts.length, totalDebt, docCount: documents.length }; // Simplified
    });
  }, [members, debtCases, documents]);

  const getMemberDebts = (memberId: string) => {
    const id = memberId === 'me' ? 'me' : memberId;
    return debtCases
      .filter((d) => d.memberId === id)
      .sort((a, b) => b.currentAmount - a.currentAmount);
  };

  const handleAddMember = () => {
    if (!formName.trim()) return;
    onAddMember({
      id: generateId(),
      name: formName,
      relation: formRelation,
      color: formColor,
      notes: formNotes,
      dateOfBirth: formDob || null,
    });
    addToast('success', `${formName} lagt til`);
    setFormName(''); setFormRelation(RELATIONS[0]); setFormColor(AVAILABLE_COLORS[0]); setFormDob(''); setFormNotes('');
    setShowNewMember(false);
  };

  const formatNOK = (amount: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount / 100);
  const calcAge = (dob: string | null) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="FAMILIE" />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Familiemedlemmer', value: members.length, icon: Users, color: 'var(--accent-blue)' },
            { label: 'Aktive gjeldssaker', value: debtCases.filter((d) => d.status !== 'closed' && d.status !== 'resolved').length, icon: Gavel, color: 'var(--accent-orange)' },
            { label: 'Total gjeld', value: formatNOK(debtCases.filter((d) => d.status !== 'closed' && d.status !== 'resolved').reduce((s, d) => s + d.currentAmount, 0)), icon: CreditCard, color: 'var(--accent-red)' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Add member */}
        <button onClick={() => setShowNewMember(true)} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-medium mb-6 transition-all"
          style={{ border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-yellow)'; e.currentTarget.style.color = 'var(--accent-yellow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <Plus size={18} /> Legg til familiemedlem
        </button>

        {/* Members grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberStats.map(({ member, debtCount, totalDebt }, i) => {
            const age = calcAge(member.dateOfBirth);
            const memberDebts = getMemberDebts(member.id);
            return (
              <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl p-5 cursor-pointer transition-all duration-200" style={{ backgroundColor: 'var(--bg-secondary)' }}
                onClick={() => setSelectedMember(member)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${member.color}30` }}>
                      <UserCircle size={24} style={{ color: member.color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{member.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{member.relation}{age !== null ? ` · ${age} år` : ''}</p>
                    </div>
                  </div>
                  {member.id !== 'me' && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteMember(member.id); addToast('info', `${member.name} fjernet`); }}
                      className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-red)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Gavel size={12} style={{ color: 'var(--accent-orange)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gjeldssaker</span>
                    </div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{debtCount}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wallet size={12} style={{ color: 'var(--accent-red)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gjeld</span>
                    </div>
                    <p className="text-lg font-semibold" style={{ color: debtCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{formatNOK(totalDebt)}</p>
                  </div>
                </div>

                {/* Recent debts preview */}
                {memberDebts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {memberDebts.slice(0, 3).map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <span className="text-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>{d.title}</span>
                        <span className="text-sm shrink-0" style={{ color: 'var(--text-primary)' }}>{formatNOK(d.currentAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* New Member Modal */}
      <AnimatePresence>
        {showNewMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowNewMember(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-md rounded-2xl p-8 pointer-events-auto" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Legg til familiemedlem</h2>
                  <button onClick={() => setShowNewMember(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Navn</label>
                    <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Fullt navn"
                      className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Relasjon</label>
                      <select value={formRelation} onChange={(e) => setFormRelation(e.target.value)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {RELATIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Fødselsdato</label>
                      <input type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)}
                        className="w-full h-11 rounded-lg px-3 text-sm outline-none" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Farge</label>
                    <div className="grid grid-cols-9 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button key={color} onClick={() => setFormColor(color)} className="w-8 h-8 rounded-full transition-all"
                          style={{ backgroundColor: color, border: formColor === color ? '3px solid var(--text-primary)' : '3px solid transparent', transform: formColor === color ? 'scale(1.15)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Notater (valgfritt)</label>
                    <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="F.eks. medisinsk info, spesielle behov..."
                      className="w-full rounded-lg px-3 py-3 text-sm outline-none resize-none" rows={2}
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  {/* Preview */}
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Forhåndsvisning:</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${formColor}30` }}>
                      <UserCircle size={18} style={{ color: formColor }} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{formName || 'Navn'} · {formRelation}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowNewMember(false)} className="flex-1 h-10 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Avbryt</button>
                  <button onClick={handleAddMember} className="flex-1 h-10 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent-yellow)', color: '#0a0a0a' }}>Legg til</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Member Detail */}
      <AnimatePresence>
        {selectedMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedMember(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-[480px] max-w-full z-[120] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedMember.name}</h3>
                <button onClick={() => setSelectedMember(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${selectedMember.color}30` }}>
                    <UserCircle size={32} style={{ color: selectedMember.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedMember.name}</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedMember.relation}{selectedMember.dateOfBirth ? ` · ${calcAge(selectedMember.dateOfBirth)} år` : ''}</p>
                  </div>
                </div>

                {selectedMember.notes && (
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <h4 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Notater</h4>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedMember.notes}</p>
                  </div>
                )}

                {/* Debts */}
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Gjeldssaker</h4>
                  {getMemberDebts(selectedMember.id).length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingen gjeldssaker</p>
                  ) : (
                    <div className="space-y-2">
                      {getMemberDebts(selectedMember.id).map((d) => (
                        <div key={d.id} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.title}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.creditor}</p>
                          </div>
                          <p className="text-sm font-medium" style={{ color: d.currentAmount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{formatNOK(d.currentAmount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
