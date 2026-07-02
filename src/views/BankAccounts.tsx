import { useEffect, useState } from 'react';
import { Plus, Trash2, Landmark, Edit2 } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [editingAccount, setEditingAccount] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
    bankName: '',
    accountName: '',
    familyMemberId: '',
    ownerFamilyMemberId: '',
    accountHolderName: '',
    disposers: [] as string[],
    includeInAnalysis: true,
    });

const createFromSuggestion = async (suggestion: any) => {
  const response = await fetch('/api/bank_accounts/from_suggestion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      suggestionId: suggestion.id,
      bankName: suggestion.bankName,
      familyMemberId: null,
    }),
  });

  const result = await response.json();

  if (result.success) {
    addToast('success', 'Bankkonto opprettet fra AI-forslag');
    await fetchSuggestions();
    window.location.reload();
  } else {
    addToast('error', result.message || 'Kunne ikke opprette bankkonto');
  }
};

const fetchSuggestions = async () => {
  try {
    const response = await fetch('/api/bank_statement_accounts/suggestions');
    const result = await response.json();

    if (result.success) {
      setSuggestions(result.suggestions ?? []);
    }
  } catch (error) {
    console.error('Kunne ikke hente kontoforslag:', error);
  }
};

useEffect(() => {
  fetchSuggestions();
}, []);

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

const saveAccountChanges = async () => {
  if (!editingAccount) return;

  try {
    const response = await fetch(`/api/bank_accounts/${editingAccount.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bankName: editForm.bankName || null,
        accountName: editForm.accountName || null,
        familyMemberId: editForm.familyMemberId ? Number(editForm.familyMemberId) : null,
        ownerFamilyMemberId: editForm.ownerFamilyMemberId ? Number(editForm.ownerFamilyMemberId) : null,
        accountHolderName: editForm.accountHolderName || null,
        disposersJson: JSON.stringify(editForm.disposers),
        includeInAnalysis: editForm.includeInAnalysis,
      }),
    });

    const result = await response.json();

   if (result.success) {
  updateBankAccount(editingAccount.id, {
    bankName: editForm.bankName || null,
    accountName: editForm.accountName || null,
    familyMemberId: editForm.familyMemberId ? Number(editForm.familyMemberId) : null,
    ownerFamilyMemberId: editForm.ownerFamilyMemberId
      ? Number(editForm.ownerFamilyMemberId)
      : null,
    accountHolderName: editForm.accountHolderName || null,
    disposersJson: JSON.stringify(editForm.disposers ?? []),
    includeInAnalysis: editForm.includeInAnalysis ? 1 : 0,
  });

      addToast('success', 'Bankkonto oppdatert');
      setEditingAccount(null);
    } else {
      addToast('error', result.message || 'Kunne ikke oppdatere bankkonto');
    }
  } catch (error) {
    console.error(error);
    addToast('error', 'Kunne ikke kontakte serveren');
  }
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

        {suggestions.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              AI fant bankkontoer
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Disse kontoene ble funnet i analyserte bankutskrifter. Du kan opprette dem med ett klikk.
            </p>

            <div className="space-y-3">
              {suggestions.map((suggestion: any) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <Landmark size={18} style={{ color: 'var(--accent-yellow)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {suggestion.accountName || suggestion.accountNumber}
                    </p>

                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {suggestion.bankName || 'Ukjent bank'} · {suggestion.accountNumber}
                    </p>

                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Eier funnet av AI: {suggestion.ownerName || 'Ikke funnet'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => createFromSuggestion(suggestion)}
                    className="h-9 px-4 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--accent-yellow)',
                      color: '#0a0a0a',
                    }}
                  >
                    Opprett
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                        let disposers: string[] = [];

                        try {
                        disposers = account.disposersJson ? JSON.parse(account.disposersJson) : [];
                        } catch {
                        disposers = [];
                        }

                        setEditingAccount(account);
                        setEditForm({
                        bankName: account.bankName ?? '',
                        accountName: account.accountName ?? '',
                        familyMemberId: account.familyMemberId ? String(account.familyMemberId) : '',
                        ownerFamilyMemberId: account.ownerFamilyMemberId ? String(account.ownerFamilyMemberId) : '',
                        accountHolderName: account.accountHolderName ?? '',
                        disposers,
                        includeInAnalysis: Number(account.includeInAnalysis) === 1,
                        });
                    }}
                    className="p-2 rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                    >
                    <Edit2 size={16} />
                    </button>
                    
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

        {editingAccount && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
    onClick={() => setEditingAccount(null)}
  >
    <div
      className="w-full max-w-2xl rounded-xl p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
        Rediger bankkonto
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <input
          value={editForm.bankName}
          onChange={(e) => setEditForm((p) => ({ ...p, bankName: e.target.value }))}
          placeholder="Bank"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />

        <input
          value={editForm.accountName}
          onChange={(e) => setEditForm((p) => ({ ...p, accountName: e.target.value }))}
          placeholder="Kontonavn"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />

        <select
          value={editForm.ownerFamilyMemberId}
          onChange={(e) => setEditForm((p) => ({ ...p, ownerFamilyMemberId: e.target.value }))}
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Juridisk eier / ikke valgt</option>
          {members.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          value={editForm.accountHolderName}
          onChange={(e) => setEditForm((p) => ({ ...p, accountHolderName: e.target.value }))}
          placeholder="Kontoholder navn"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Disponenter
        </p>

        <div className="grid grid-cols-2 gap-2">
          {members.map((m: any) => {
            const id = String(m.id);
            const checked = editForm.disposers.includes(id);

            return (
              <label key={m.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      disposers: e.target.checked
                        ? [...p.disposers, id]
                        : p.disposers.filter((x) => x !== id),
                    }))
                  }
                />
                {m.name}
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 mt-5 text-sm" style={{ color: 'var(--text-primary)' }}>
        <input
          type="checkbox"
          checked={editForm.includeInAnalysis}
          onChange={(e) => setEditForm((p) => ({ ...p, includeInAnalysis: e.target.checked }))}
        />
        Ta med i analyser
      </label>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => setEditingAccount(null)}
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
          onClick={saveAccountChanges}
          className="h-10 px-5 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--accent-yellow)',
            color: '#0a0a0a',
          }}
        >
          Lagre
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
    
  );
}