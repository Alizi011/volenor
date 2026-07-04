import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Receipt } from 'lucide-react';
import type { FinanceEntry } from '../types';

interface FinanceBillsProps {
  finances: FinanceEntry[];
  financialItems: any[];
  onMarkFinancialItemAsPaid: (input: { id: number; amount?: number | null }) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: 'Betalt', color: 'var(--accent-green)', icon: CheckCircle2 },
  unpaid: { label: 'Ikke betalt', color: 'var(--accent-orange)', icon: Clock },
  pending: { label: 'Ikke betalt', color: 'var(--accent-orange)', icon: Clock },
  active: { label: 'Aktiv', color: 'var(--accent-orange)', icon: Clock },
  pending_approval: { label: 'Venter godkjenning', color: 'var(--accent-orange)', icon: Clock },
  overdue: { label: 'Forfalt', color: 'var(--accent-red)', icon: AlertTriangle },
};

export default function FinanceBills({
  finances,
  financialItems,
  onMarkFinancialItemAsPaid,
}: FinanceBillsProps) {
  const formatNOK = (amount: number) =>
    new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);

  const bills = useMemo(() => {
    const newItems = (financialItems ?? []).map((item) => ({
      id: `financial-${item.id}`,
      rawId: Number(item.id),
      source: 'financial',
      title: item.title,
      amount: Number(item.currentAmount ?? item.originalAmount ?? 0),
      status: item.status,
      dueDate: item.dueDate,
      category: item.category || 'Uten kategori',
      canMarkPaid: item.status !== 'paid',
    }));

    const legacyItems = (finances ?? [])
      .filter((f) => f.type === 'expense' && ['pending', 'overdue', 'paid'].includes(f.status))
      .map((f) => ({
        id: `legacy-${f.id}`,
        rawId: f.id,
        source: 'legacy',
        title: f.title,
        amount: Number(f.amount ?? 0),
        status: f.status,
        dueDate: f.date,
        category: f.category || 'Uten kategori',
        canMarkPaid: false,
      }));

    return [...newItems, ...legacyItems];
  }, [financialItems, finances]);

  const billStats = useMemo(() => {
    const unpaid = bills.filter((b) =>
      ['unpaid', 'pending', 'active', 'pending_approval'].includes(b.status)
    );
    const overdue = bills.filter((b) => b.status === 'overdue');
    const paid = bills.filter((b) => b.status === 'paid');

    return {
      all: bills,
      unpaid,
      overdue,
      paid,
      unpaidTotal: unpaid.reduce((sum, b) => sum + b.amount, 0),
      overdueTotal: overdue.reduce((sum, b) => sum + b.amount, 0),
      paidTotal: paid.reduce((sum, b) => sum + b.amount, 0),
    };
  }, [bills]);

  const sortedBills = [...billStats.all].sort((a, b) => {
    const order: Record<string, number> = {
      overdue: 0,
      unpaid: 1,
      pending: 1,
      active: 2,
      pending_approval: 3,
      paid: 4,
    };

    const statusDiff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Ikke betalt', value: formatNOK(billStats.unpaidTotal), count: billStats.unpaid.length, icon: Clock, color: 'var(--accent-orange)' },
          { label: 'Forfalt', value: formatNOK(billStats.overdueTotal), count: billStats.overdue.length, icon: AlertTriangle, color: 'var(--accent-red)' },
          { label: 'Betalt', value: formatNOK(billStats.paidTotal), count: billStats.paid.length, icon: CheckCircle2, color: 'var(--accent-green)' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={18} style={{ color: card.color }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {card.count} regninger
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={18} style={{ color: 'var(--accent-yellow)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Regningsoversikt
          </h3>
        </div>

        <div className="space-y-2">
          {sortedBills.map((entry) => {
            const config = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.unpaid;
            const StatusIcon = config.icon;

            return (
              <div key={entry.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Receipt size={18} style={{ color: 'var(--accent-yellow)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Forfall/dato: {entry.dueDate || 'Ikke satt'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Kategori: {entry.category}
                    </span>
                    {entry.source === 'legacy' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        Gammel post
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatNOK(entry.amount)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <StatusIcon size={12} style={{ color: config.color }} />
                    <span className="text-xs" style={{ color: config.color }}>
                      {config.label}
                    </span>
                  </div>

                  {entry.canMarkPaid && (
                    <button
                      type="button"
                      onClick={() => onMarkFinancialItemAsPaid({ id: Number(entry.rawId), amount: entry.amount })}
                      className="text-xs mt-1 underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Marker betalt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}