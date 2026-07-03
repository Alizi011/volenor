import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react';
import type { FinanceEntry } from '../types';

interface FinanceBillsProps {
  finances: FinanceEntry[];
  financialItems: any[];
  onMarkFinancialItemAsPaid: (input: { id: number; amount?: number | null }) => void;
}

const STATUS_CONFIG = {
  paid: { label: 'Betalt', color: 'var(--accent-green)', icon: CheckCircle2 },
  pending: { label: 'Ikke betalt', color: 'var(--accent-orange)', icon: Clock },
  overdue: { label: 'Forfalt', color: 'var(--accent-red)', icon: AlertTriangle },
};

export default function FinanceBills({
  finances,
  financialItems,
  onMarkFinancialItemAsPaid,
}: FinanceBillsProps) {

  const billStats = useMemo(() => {
    const billEntries = finances.filter(
      (f) =>
        f.type === 'expense' &&
        ['pending', 'overdue', 'paid'].includes(f.status)
    );

    const unpaid = billEntries.filter((f) => f.status === 'pending');
    const overdue = billEntries.filter((f) => f.status === 'overdue');
    const paid = billEntries.filter((f) => f.status === 'paid');

    return {
      all: billEntries,
      unpaid,
      overdue,
      paid,
      unpaidTotal: unpaid.reduce((sum, f) => sum + f.amount, 0),
      overdueTotal: overdue.reduce((sum, f) => sum + f.amount, 0),
      paidTotal: paid.reduce((sum, f) => sum + f.amount, 0),
    };
  }, [finances]);

  const formatNOK = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(amount);
  };

  const sortedBills = [...billStats.all].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      overdue: 0,
      pending: 1,
      paid: 2,
    };

    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Ikke betalt',
            value: formatNOK(billStats.unpaidTotal),
            count: billStats.unpaid.length,
            icon: Clock,
            color: 'var(--accent-orange)',
          },
          {
            label: 'Forfalt',
            value: formatNOK(billStats.overdueTotal),
            count: billStats.overdue.length,
            icon: AlertTriangle,
            color: 'var(--accent-red)',
          },
          {
            label: 'Betalt',
            value: formatNOK(billStats.paidTotal),
            count: billStats.paid.length,
            icon: CheckCircle2,
            color: 'var(--accent-green)',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={18} style={{ color: card.color }} />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                {card.label}
              </span>
            </div>

            <div
              className="text-2xl font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {card.value}
            </div>

            <div
              className="text-xs mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {card.count} regninger
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={18} style={{ color: 'var(--accent-yellow)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Regningsoversikt
          </h3>
        </div>

        {sortedBills.length === 0 ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Ingen regninger registrert ennå
          </p>
        ) : (
          <div className="space-y-2">
            {sortedBills.map((entry) => {
              const StatusIcon = STATUS_CONFIG[entry.status].icon;

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <Receipt
                      size={18}
                      style={{ color: 'var(--accent-yellow)' }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Dato: {entry.date}
                      </span>

                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Kategori: {entry.category}
                      </span>

                      {entry.isRecurring && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Gjentakende
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatNOK(entry.amount)}
                    </p>

                    <div className="flex items-center gap-1 justify-end">
                      <StatusIcon
                        size={12}
                        style={{ color: STATUS_CONFIG[entry.status].color }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: STATUS_CONFIG[entry.status].color }}
                      >
                        {STATUS_CONFIG[entry.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}