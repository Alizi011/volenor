import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, FileText, Eye, Plus, X, FolderInput } from 'lucide-react';
import Header from '../components/Header';
import BankStatementDetails from './BankStatementDetails';

type BankStatement = {
  id: string | number;
  name?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  fileData?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

interface BankStatementsProps {
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

export default function BankStatements({
  addToast,
}: BankStatementsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploadForm, setUploadForm] = useState({
  name: '',
  bankName: '',
  accountNumber: '',
  periodStart: '',
  periodEnd: '',
});

  const fetchBankStatements = async () => {
  try {
    setIsLoading(true);

    const response = await fetch('/api/bank_statements');
    const result = await response.json();

    if (result.success) {
      setBankStatements(result.bankStatements ?? []);
    } else {
      addToast('error', result.message || 'Kunne ikke hente bankutskrifter');
    }
  } catch (error) {
    console.error('Feil ved henting av bankutskrifter:', error);
    addToast('error', 'Kunne ikke kontakte serveren');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchBankStatements();
}, []);

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

  const handleUploadBankStatement = async () => {
  if (!selectedFile) {
    addToast('warning', 'Velg en PDF først');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', uploadForm.name || selectedFile.name);

    const response = await fetch('/api/last_opp_bank', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      addToast('success', 'Bankutskrift lastet opp');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({
        name: '',
        bankName: '',
        accountNumber: '',
        periodStart: '',
        periodEnd: '',
      });
      await fetchBankStatements();
    } else {
      addToast('error', result.message || 'Kunne ikke laste opp bankutskrift');
    }
  } catch (error) {
    console.error(error);
    addToast('error', 'Kunne ikke laste opp bankutskrift');
  }
};


        if (selectedStatement) {

  return (

    <BankStatementDetails

      statement={selectedStatement}

      onBack={() => setSelectedStatement(null)}

      addToast={addToast}

    />

  );
  }

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
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: 'var(--accent-yellow)',
              color: '#0a0a0a',
            }}
          >
            <Plus size={16} />
            Last opp bankutskrift
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Alle bankutskrifter
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {filteredStatements.length} opplastede bankutskrifter
            </p>
          </div>
        </div>

        {isLoading ? (
  <div className="flex flex-col items-center justify-center py-20">
    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
      Henter bankutskrifter...
    </p>
  </div>
) : filteredStatements.length === 0 ? (

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
                  onClick={() => setSelectedStatement(statement)}
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

        {showUploadModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
  >
    <div
      className="w-full max-w-lg rounded-2xl p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Last opp bankutskrift
        </h2>

        <button onClick={() => setShowUploadModal(false)}>
          <X size={20} />
        </button>
      </div>

      <label
        className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer mb-5"
        style={{
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <FolderInput size={36} className="mb-3" />

        <span className="text-sm">
          {selectedFile ? selectedFile.name : 'Klikk for å velge PDF'}
        </span>

        <input
          hidden
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setSelectedFile(e.target.files?.[0] ?? null)
          }
        />
      </label>

      <div className="space-y-3">

          <input
          value={uploadForm.name}
          onChange={(e) =>
            setUploadForm((p) => ({
              ...p,
              name: e.target.value,
            }))
          }
          placeholder="Navn, valgfritt"
          className="w-full h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />


      </div>

      <div className="flex gap-3 mt-6">

        <button
          className="flex-1 h-10 rounded-lg"
          onClick={() => setShowUploadModal(false)}
        >
          Avbryt
        </button>

        <button
          className="flex-1 h-10 rounded-lg"
          style={{
            backgroundColor: 'var(--accent-yellow)',
            color: '#000',
          }}
          onClick={handleUploadBankStatement}
        >
          Last opp
        </button>

      </div>

    </div>
  </div>
)}

      </div>
    </div>
  );
}