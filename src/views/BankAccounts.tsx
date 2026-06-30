import { useState } from 'react';
import { Plus, Trash2, Landmark } from 'lucide-react';
import Header from '../components/Header';
import { useSynapseBankAccounts, useSynapseFamily } from '../hooks/useSynapse';

interface BankAccountsProps {
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
}

export default function BankAccounts({ addToast }: BankAccountsProps) {
  const { bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } = useSynapseBankAccounts();
  const { members } = useSynapseFamily();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [includeInAnalysis, setIncludeInAnalysis] = useState(true);

  const handleAdd = () => {
    if (!accountNumber.trim()) {
      addToast('warning', 'Kontonummer mangler');
      return;
    }

    addBankAccount({
      bankName: bankName || null,
      accountNumber,
      accountName: accountName || null,
      familyMemberId: familyMemberId ? Number(familyMemberId) : null,
      includeInAnalysis: includeInAnalysis ? 1 : 0,
    });

    addToast('success', 'Bankkonto lagt til');

    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setFamilyMemberId('');
    setIncludeInAnalysis(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="BANKKONTOER" />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Legg til bankkonto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank"
              className="h-10 rounded-lg px-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Kontonummer"
              className="h-10 rounded-lg px-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Kontonavn"
              className="h-10 rounded-lg px-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            <select
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              className="h-10 rounded-lg px-3 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Felles / ikke valgt</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              className="h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--accent-yellow)',
                color: '#0a0a0a',
              }}
            >
              <Plus size={16} />
              Legg til
            </button>
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={includeInAnalysis}
              onChange={(e) => setIncludeInAnalysis(e.target.checked)}
            />
            Ta med i analyser
          </label>
        </div>

        <div className="space-y-3">
          {bankAccounts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ingen bankkontoer lagt til ennå.
            </p>
          ) : (
            bankAccounts.map((account: any) => {
              const member = members.find((m: any) => Number(m.id) === Number(account.familyMemberId));

              return (
                <div
                  key={account.id}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <Landmark size={18} style={{ color: 'var(--accent-yellow)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {account.accountName || account.accountNumber}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {account.bankName || 'Ukjent bank'} · {account.accountNumber}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Eier: {member?.name || 'Felles / ikke valgt'}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={Number(account.includeInAnalysis) === 1}
                      onChange={(e) =>
                        updateBankAccount(account.id, {
                          includeInAnalysis: e.target.checked ? 1 : 0,
                        })
                      }
                    />
                    Ta med
                  </label>

                  <button
                    onClick={() => {
                      deleteBankAccount(account.id);
                      addToast('info', 'Bankkonto slettet');
                    }}
                    className="p-2 rounded-lg"
                    style={{ color: 'var(--accent-red)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}