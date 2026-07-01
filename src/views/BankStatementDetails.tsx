import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';

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

interface BankStatementDetailsProps {
  statement: BankStatement;
  onBack: () => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

export default function BankStatementDetails({
  statement,
  onBack,
  addToast,
}: BankStatementDetailsProps) {
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [savedTransactions, setSavedTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

const [editTransaction, setEditTransaction] = useState({
  merchant: '',
  category: '',
  cashflowType: 'unknown',
  description: '',
  direction: 'expense',
  matchStatus: 'unmatched',
  amount: '',
  note: '',
});

const [savingTransaction, setSavingTransaction] = useState(false);
  

const fetchSavedTransactions = async () => {
  try {
    const response = await fetch(`/api/bank_transactions/${statement.id}`);
    const result = await response.json();

    if (result.success) {
      setSavedTransactions(result.transactions ?? []);
    }
  } catch (error) {
    console.error('Kunne ikke hente lagrede banktransaksjoner:', error);
  }
};

useEffect(() => {
  fetchSavedTransactions();
}, [statement.id]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Ikke satt';

    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

const saveTransactionChanges = async () => {
  if (!selectedTransaction) return;

  setSavingTransaction(true);

  try {
    const response = await fetch(`/api/bank_transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editTransaction),
    });

    const result = await response.json();

    if (result.success) {
      await fetchSavedTransactions();
      addToast('success', 'Transaksjon oppdatert');
      setSelectedTransaction(null);
    } else {
      addToast('error', result.message || 'Kunne ikke lagre transaksjonen');
    }
  } catch (error) {
    console.error(error);
    addToast('error', 'Kunne ikke kontakte serveren');
  } finally {
    setSavingTransaction(false);
  }
};

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {statement.name || 'Bankutskrift'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {statement.bankName || 'Ukjent bank'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
  try {
    const response = await fetch('/api/analyze_bank_statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statementId: statement.id,
      }),
    });


    
    const result = await response.json();

    if (result.success) {
  setAnalysisResult(result);
  await fetchSavedTransactions();
  addToast('success', `Fant ${result.transactionBlocks?.length ?? 0} transaksjonsblokker`);
  console.log(result);
    }
else {
      addToast('error', result.message || 'Analyse mislyktes');
    }
  } catch (error) {
    console.error(error);
    addToast('error', 'Kunne ikke kontakte serveren');
  }
}}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--accent-yellow)',
            color: '#0a0a0a',
          }}
        >
          <Sparkles size={16} />
          Analyser bankutskrift
        </button>
      </div>

<div className="flex-1 overflow-hidden flex flex-col">
  <div
    className="mx-6 mt-5 rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-4"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <Info label="Bank" value={statement.bankName || 'Ikke satt'} />
    <Info label="Kontonummer" value={statement.accountNumber || 'Ikke satt'} />
    <Info label="Periode fra" value={formatDate(statement.periodStart)} />
    <Info label="Periode til" value={formatDate(statement.periodEnd)} />
    <Info label="Status" value={statement.status || 'uploaded'} />
    <Info label="Transaksjoner" value={`${savedTransactions.length} stk`} />
  </div>
 
 <main className="p-6 overflow-hidden flex-1">
  <div className="grid grid-cols-[450px_minmax(0,1fr)] gap-5 h-full min-h-0">

    <section
      className="rounded-xl p-4 overflow-y-auto min-h-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Transaksjoner
      </h3>

      {(savedTransactions.length > 0 || analysisResult?.aiTransactionsPreview) ? (
        <div className="space-y-3">
          {(savedTransactions.length > 0 ? savedTransactions : analysisResult.aiTransactionsPreview).map((tx: any, i: number) => {
            const isIncome = tx.direction === 'income';

            const title = tx.merchant || tx.description || 'Ukjent transaksjon';
            const txDate = tx.transactionDate || tx.date;

            const formattedDate = txDate
              ? new Date(txDate).toLocaleDateString('nb-NO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Ukjent dato';

            const amount = Number(tx.amount ?? 0).toLocaleString('nb-NO', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={tx.id ?? tx.sourceIndex ?? i}
                onClick={() => {
                  setSelectedTransaction(tx);
                setEditTransaction({
                merchant: tx.merchant ?? '',
                category: tx.category ?? '',
                cashflowType: tx.cashflowType ?? 'unknown',
                description: tx.description ?? '',
                direction: tx.direction ?? 'expense',
                matchStatus: tx.matchStatus ?? 'unmatched',
                amount: String(tx.amount ?? ''),
                note: tx.note ?? '',
              });
                }}
                className="rounded-lg p-4 cursor-pointer transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </p>

                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {tx.category || 'Ikke kategorisert'} · {getCashflowLabel(tx.cashflowType)} · {formattedDate}
                    </p>
                  </div>

                  <p
                    className="text-sm font-bold shrink-0"
                    style={{
                      color: isIncome ? 'var(--accent-green)' : 'var(--text-primary)',
                    }}
                  >
                    {isIncome ? '+' : '-'}{amount} kr
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ingen transaksjoner analysert ennå.
        </p>
      )}
    </section>

    <section
      className="rounded-xl overflow-hidden h-full"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    >
      {statement.fileData ? (
        <iframe
        src={statement.fileData}
        title={statement.name || 'Bankutskrift'}
        className="w-full h-full border-0"
        style={{
          minHeight: '100%',
          backgroundColor: '#fff',
        }}
      />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <FileText size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ingen PDF-fil funnet
          </p>
        </div>
      )}
    </section>

  </div>
</main>

{selectedTransaction && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
    onClick={() => setSelectedTransaction(null)}
  >
    <div
      className="w-full max-w-2xl rounded-xl p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Rediger transaksjon
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {selectedTransaction.transactionDate || selectedTransaction.date || 'Ukjent dato'} ·{' '}
            {selectedTransaction.amount ?? 'Ukjent'} kr
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedTransaction(null)}
          className="h-9 px-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
        >
          Lukk
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
            Motpart
          </label>
          <input
            type="text"
            value={editTransaction.merchant}
            onChange={(e) =>
              setEditTransaction((prev) => ({
                ...prev,
                merchant: e.target.value,
              }))
            }
            className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

<div>
  <label
    className="text-xs uppercase tracking-wider font-medium"
    style={{ color: 'var(--text-secondary)' }}
  >
    Beløp
  </label>

  <input
  type="number"
  step="0.01"
  inputMode="decimal"
  value={editTransaction.amount}

    onChange={(e) =>
      setEditTransaction((prev) => ({
        ...prev,
        amount: e.target.value,
      }))
    }
    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>

        <div>
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
            Kategori
          </label>
          <input
            type="text"
            value={editTransaction.category}
            onChange={(e) =>
              setEditTransaction((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
            Type
          </label>
          <select
            value={editTransaction.direction}
            onChange={(e) =>
              setEditTransaction((prev) => ({
                ...prev,
                direction: e.target.value,
              }))
            }
            className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="expense">Utbetaling</option>
            <option value="income">Innbetaling</option>
          </select>
        </div>

<div>
  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
    Pengestrøm
  </label>
  <select
    value={editTransaction.cashflowType}
    onChange={(e) =>
      setEditTransaction((prev) => ({
        ...prev,
        cashflowType: e.target.value,
      }))
    }
    className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  >
    <option value="unknown">Uklassifisert</option>
    <option value="fixed_income">Fast inntekt</option>
    <option value="variable_income">Variabel inntekt</option>
    <option value="one_time_income">Engangsinntekt</option>
    <option value="fixed_expense">Fast utgift</option>
    <option value="variable_expense">Variabel utgift</option>
    <option value="one_time_expense">Engangsutgift</option>
    <option value="internal_transfer">Intern overføring</option>
    <option value="private_transfer">Privat overføring</option>
    <option value="saving_investment">Sparing/investering</option>
  </select>
</div>

        <div>
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
            Matchstatus
          </label>
          <select
            value={editTransaction.matchStatus}
            onChange={(e) =>
              setEditTransaction((prev) => ({
                ...prev,
                matchStatus: e.target.value,
              }))
            }
            className="mt-2 w-full h-10 rounded-lg px-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="unmatched">Ikke matchet</option>
            <option value="possible">Mulig match</option>
            <option value="matched">Matchet</option>
            <option value="ignored">Ignorert</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
          Beskrivelse
        </label>
        <textarea
          value={editTransaction.description}
          onChange={(e) =>
            setEditTransaction((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          rows={3}
          className="mt-2 w-full rounded-lg px-3 py-3 text-sm outline-none resize-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="mt-5">
  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
    Notat
  </label>
  <textarea
    value={editTransaction.note}
    onChange={(e) =>
      setEditTransaction((prev) => ({
        ...prev,
        note: e.target.value,
      }))
    }
    rows={3}
    placeholder="Skriv eget notat til transaksjonen..."
    className="mt-2 w-full rounded-lg px-3 py-3 text-sm outline-none resize-none"
    style={{
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
    }}
  />
</div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
          Original tekst fra bankutskrift
        </label>

        <pre
          className="mt-2 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}
        >
          {selectedTransaction.rawText || 'Ingen originaltekst lagret'}
        </pre>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => setSelectedTransaction(null)}
          className="h-10 px-4 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
        >
          Avbryt
        </button>

        <button
          type="button"
          onClick={saveTransactionChanges}
          disabled={savingTransaction}
          className="h-10 px-5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent-yellow)',
            color: '#0a0a0a',
          }}
        >
          {savingTransaction ? 'Lagrer...' : 'Lagre endringer'}
        </button>
      </div>
    </div>
  </div>
)}

       
      </div>
    </div>
  );
}

function getCashflowLabel(value?: string | null) {
  switch (value) {
    case 'fixed_income':
      return 'Fast inntekt';
    case 'variable_income':
      return 'Variabel inntekt';
    case 'fixed_expense':
      return 'Fast utgift';
    case 'variable_expense':
      return 'Variabel utgift';
    case 'internal_transfer':
      return 'Intern overføring';
    case 'private_transfer':
      return 'Privat overføring';
    case 'saving_investment':
      return 'Sparing/investering';
    case 'one_time_income':
      return 'Engangsinntekt';
    case 'one_time_expense':
      return 'Engangsutgift';
    default:
      return 'Uklassifisert';
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      <p className="text-sm mt-1 break-words" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}