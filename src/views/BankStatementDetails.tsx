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

      <div className="flex-1 overflow-hidden grid grid-cols-[320px_1fr]">
        <aside
          className="p-6 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
          }}
        >
          <div className="space-y-5">
            <Info label="Bank" value={statement.bankName || 'Ikke satt'} />
            <Info label="Kontonummer" value={statement.accountNumber || 'Ikke satt'} />
            <Info label="Periode fra" value={formatDate(statement.periodStart)} />
            <Info label="Periode til" value={formatDate(statement.periodEnd)} />
            <Info label="Opplastet" value={formatDate(statement.createdAt)} />
            <Info label="Status" value={statement.status || 'uploaded'} />
          </div>
        </aside>

        <main className="p-6 overflow-y-auto">
          <div
            className="h-[65vh] rounded-xl overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            {statement.fileData ? (
              <iframe
                src={statement.fileData}
                title={statement.name || 'Bankutskrift'}
                className="w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <FileText size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Ingen PDF-fil funnet
                </p>
              </div>
            )}
          </div>


          {analysisResult?.aiPreview && (
  <div
    className="mt-4 rounded-xl p-4"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
      AI-tolket transaksjon
    </h3>

    <div className="grid grid-cols-2 gap-3 text-xs">
      <Info label="Dato" value={analysisResult.aiPreview.date || 'Ukjent'} />
      <Info label="Beløp" value={`${analysisResult.aiPreview.amount ?? 'Ukjent'} kr`} />
      <Info label="Type" value={analysisResult.aiPreview.direction || 'unknown'} />
      <Info label="Kategori" value={analysisResult.aiPreview.category || 'Ikke satt'} />
      <Info label="Motpart" value={analysisResult.aiPreview.merchant || 'Ikke funnet'} />
      <Info label="Sikkerhet" value={`${Math.round((analysisResult.aiPreview.confidence ?? 0) * 100)} %`} />
    </div>

    <div className="mt-3">
      <Info label="Beskrivelse" value={analysisResult.aiPreview.description || 'Ingen beskrivelse'} />
    </div>
  </div>
)}
         {(savedTransactions.length > 0 || analysisResult?.aiTransactionsPreview) && (
  <div
    className="mt-4 rounded-xl p-4 max-h-96 overflow-y-auto"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
      AI-tolkede transaksjoner
    </h3>

    <div className="space-y-3">

      {(savedTransactions.length > 0 ? savedTransactions : analysisResult.aiTransactionsPreview).map((tx: any, i: number) => {
        const isIncome = tx.direction === 'income';
        const isExpense = tx.direction === 'expense';

        const typeLabel = isIncome
          ? 'Innbetaling'
          : isExpense
            ? 'Utbetaling'
            : 'Ukjent';

        const title =
          tx.merchant ||
          tx.description ||
          'Ukjent transaksjon';

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

        const confidence = Math.round((tx.confidence ?? 0) * 100);

        return (
          <div
            key={tx.sourceIndex ?? i}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </p>

                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {tx.category || 'Ikke kategorisert'} · {typeLabel}
                </p>

                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {formattedDate}
                </p>

                {!tx.merchant && tx.description && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {tx.description}
                  </p>
                )}

                {confidence < 75 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--accent-orange)' }}>
                    Lav AI-sikkerhet: {confidence} %
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p
                  className="text-base font-bold"
                  style={{
                    color: isIncome ? 'var(--accent-green)' : 'var(--text-primary)',
                  }}
                >
                  {isIncome ? '+' : '-'}{amount} kr
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}


        </main>
      </div>
    </div>
  );
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