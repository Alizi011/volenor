import { FileText, History, Bot, ArrowLeft } from "lucide-react";
import { useCaseWorkspace } from "@/hooks/useCaseWorkspace";
import { useState } from "react";
import { trpc } from "@/providers/trpc";

interface CaseWorkspaceProps {
  caseId: number | null;
  onBack?: () => void;
}

export default function CaseWorkspace({ caseId, onBack }: CaseWorkspaceProps) {
  const { data, isLoading, error } = useCaseWorkspace(caseId);

  const utils = trpc.useUtils();

const [showPaymentForm, setShowPaymentForm] = useState(false);
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentDate, setPaymentDate] = useState(
  new Date().toISOString().slice(0, 10)
);
const [paymentNote, setPaymentNote] = useState("");

const registerPayment =
  trpc.synapse.workspace.registerPayment.useMutation({
    onSuccess: async () => {
      await utils.synapse.workspace.get.invalidate({
        caseId: caseId ?? 0,
      });

      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentNote("");
    },
  });
  

  if (!caseId) return <div className="p-6">Ingen sak valgt.</div>;
  if (isLoading) return <div className="p-6">Laster sak...</div>;
  if (error) return <div className="p-6">Feil: {error.message}</div>;
  if (!data) return <div className="p-6">Ingen data.</div>;

  const c = data.case;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-secondary)" }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={16} /> Tilbake til åpne saker
          </button>
        )}

        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {c.caseNumber ?? `CASE-${c.id}`}
            </p>
            <h1 className="text-2xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
              {c.title}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {c.originalCreditor ?? c.collectionAgency ?? c.type}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
              Saldo
            </p>
            <p className="text-2xl font-semibold" style={{ color: "var(--accent-yellow)" }}>
              {Number(c.currentBalance ?? 0).toLocaleString("nb-NO")} kr
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Status: {c.status}
            </p>
          </div>
        </div>
        
          {showPaymentForm && (
  <div
    className="rounded-2xl p-5"
    style={{ backgroundColor: "var(--bg-secondary)" }}
  >
    <h2
      className="text-sm font-semibold mb-4"
      style={{ color: "var(--text-primary)" }}
    >
      Registrer betaling
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        placeholder="Beløp"
        className="h-10 rounded-lg px-3 text-sm outline-none"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        }}
      />

      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        className="h-10 rounded-lg px-3 text-sm outline-none"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        }}
      />

      <input
        value={paymentNote}
        onChange={(e) => setPaymentNote(e.target.value)}
        placeholder="Kommentar"
        className="h-10 rounded-lg px-3 text-sm outline-none"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowPaymentForm(false)}
          className="flex-1 h-10 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          }}
        >
          Avbryt
        </button>

        <button
          onClick={() => {
            const amount = Number(paymentAmount.replace(",", "."));

            if (!caseId || !amount || amount <= 0) {
              return;
            }

            registerPayment.mutate({
              caseId,
              amount,
              paidDate: paymentDate,
              note: paymentNote || null,
            });
          }}
          disabled={registerPayment.isPending}
          className="flex-1 h-10 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--accent-yellow)",
            color: "#0a0a0a",
            opacity: registerPayment.isPending ? 0.7 : 1,
          }}
        >
          {registerPayment.isPending ? "Lagrer..." : "Lagre"}
        </button>
      </div>
    </div>
  </div>
)}

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <section className="rounded-2xl p-5 overflow-y-auto" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <FileText size={18} /> Dokumenter ({data.statistics.documentCount})
          </h2>

          <div className="space-y-3">
            {data.documents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ingen dokumenter.</p>
            ) : (
              data.documents.map((doc: any) => (
                <div key={doc.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {doc.fileName}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {doc.detectedType ?? "Ukjent"} · {doc.createdAt}
                  </p>

                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="mt-3 h-9 px-4 rounded-lg text-sm font-medium"
                    style={{
                        backgroundColor: "var(--accent-yellow)",
                        color: "#0a0a0a",
                    }}
                    >
                    Registrer betaling
                    </button>
                </div>
              ))
            )}
          </div>

        </section>

        <section className="rounded-2xl p-5 overflow-y-auto" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <History size={18} /> Tidslinje ({data.statistics.eventCount})
          </h2>

          <div className="space-y-3">
            {data.events.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ingen hendelser.</p>
            ) : (
              data.events.map((event: any) => (
                <div key={event.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-primary)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {event.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {event.eventType} · {event.createdAt}
                  </p>
                  {event.description && (
                    <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                      {event.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl p-5 overflow-y-auto" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <Bot size={18} /> AI og nøkkelinfo
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Oppsummering</p>
              <p style={{ color: "var(--text-primary)" }}>
                {data.aiSummary ?? "Ingen AI-oppsummering ennå."}
              </p>
            </div>

            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--bg-primary)" }}>
              <Info label="Kreditor" value={c.originalCreditor} />
              <Info label="Inkassobyrå" value={c.collectionAgency} />
              <Info label="Offentlig instans" value={c.publicAuthority} />
              <Info label="Frist" value={c.deadline} />
              <Info label="Referanse" value={c.externalReference} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="text-right" style={{ color: "var(--text-primary)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}