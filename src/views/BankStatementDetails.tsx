import { useState } from 'react';
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
          {analysisResult?.transactionBlocks && (
  <div
    className="mt-4 rounded-xl p-4 max-h-72 overflow-y-auto"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
      Fant {analysisResult.transactionBlocks.length} transaksjonsblokker
    </h3>

    <div className="space-y-3">
      {analysisResult.transactionBlocks.map((block: any) => (
        <div
          key={block.index}
          className="rounded-lg p-3"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-yellow)' }}>
            {block.date}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {block.rawText}
          </p>
        </div>
      ))}
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