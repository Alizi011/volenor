import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, FileText, Eye } from 'lucide-react';
import Header from '../components/Header';

type BankStatement = {
  id: string | number;
  bankName?: string | null;
  accountNumber?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  filePath?: string | null;
  createdAt?: string | null;
};

interface BankStatementsProps {
  bankStatements: BankStatement[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

export default function BankStatements({
  bankStatements,
  addToast,
}: BankStatementsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStatements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return bankStatements
      .filter((statement) => {
        if (!q) return true;

        return (
          (statement.bankName ?? '').toLowerCase().includes(q) ||
          (statement.accountNumber ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt ?? '').getTime() || 0;
        const bTime = new Date(b.createdAt ?? '').getTime() || 0;
        return bTime - aTime;
      });
  }, [bankStatements, searchQuery]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Ikke satt';

    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPeriod = (start?: string | null, end?: string | null) => {
    if (!start && !end) return 'Ikke satt';
    return `${formatDate(start)} – ${formatDate(end)}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="BANKUTSKRIFTER"
        showSearch
        searchPlaceholder="Søk i bankutskrifter..."
        onSearch={setSearchQuery}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Alle bankutskrifter
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {filteredStatements.length} opplastede bankutskrifter
            </p>
          </div>
        </div>

        {filteredStatements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Landmark size={64} className="mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
              Ingen bankutskrifter funnet
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Last opp en bankutskrift fra dokumentmodulen først
            </p>
          </div>
        ) : (
          <div>
            <div
              className="grid gap-4 px-4 pb-3 text-xs font-medium uppercase"
              style={{
                gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 90px',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span>Bank</span>
              <span>Kontonummer</span>
              <span>Periode</span>
              <span>Opplastet</span>
              <span></span>
            </div>

            {filteredStatements.map((statement, i) => (
              <motion.div
                key={statement.id ?? `bank-statement-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid gap-4 px-4 py-3 items-center transition-colors"
                style={{
                  gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 90px',
                  borderBottom: '1px solid rgba(42,42,42,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {statement.bankName || 'Ukjent bank'}
                  </span>
                </div>

                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {statement.accountNumber || 'Ikke satt'}
                </span>

                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatPeriod(statement.periodStart, statement.periodEnd)}
                </span>

                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(statement.createdAt)}
                </span>

                <button
                  type="button"
                  onClick={() => addToast('info', 'Detaljside kommer i neste steg')}
                  className="flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Eye size={14} />
                  Åpne
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}