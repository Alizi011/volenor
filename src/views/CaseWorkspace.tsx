import {
  FileText,
  History,
  Bot,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
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
const [newCaseNote, setNewCaseNote] = useState("");

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

const addNote =
  trpc.synapse.workspace.addNote.useMutation({
    onSuccess: async () => {
      await utils.synapse.workspace.get.invalidate({
        caseId: caseId ?? 0,
      });

      setNewCaseNote("");
    },
  });
  

  if (!caseId) return <div className="p-6">Ingen sak valgt.</div>;
  if (isLoading) return <div className="p-6">Laster sak...</div>;
  if (error) return <div className="p-6">Feil: {error.message}</div>;
  if (!data) return <div className="p-6">Ingen data.</div>;

  const c = data.case;

  const primaryDocument = data.documents?.[0];

  const displayedCreditor =
  c.originalCreditor ??
  primaryDocument?.detectedSender ??
  c.title ??
  null;

const displayedDeadline =
  c.deadline ??
  primaryDocument?.detectedDueDate ??
  null;

const displayedCollectionAgency =
  c.collectionAgency ??
  (
    data.aiSummary?.includes("PayEx")
      ? "PayEx Sverige AB"
      : null
  );

const displayedReference =
  c.externalReference ??
  primaryDocument?.subject ??
  null;

const paidAmount = (data.finance ?? [])
  .filter((f: any) => f.status === "paid")
  .reduce(
    (sum: number, f: any) =>
      sum + Number(f.originalAmount ?? f.currentAmount ?? 0),
    0
  );

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

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
          <KpiCard
         title="Originalt krav"
        value={`${Number(c.originalClaim ?? 0).toLocaleString("nb-NO")} kr`}
        />

         <KpiCard
            title="Betalt"
            value={`${paidAmount.toLocaleString("nb-NO")} kr`}
            />

          <KpiCard
            title="Utestående"
            value={`${Number(c.currentBalance ?? 0).toLocaleString("nb-NO")} kr`}
          />

          <KpiCard
            title="Status"
            value={c.status ?? "-"}
          />

          <KpiCard
            title="Forfall"
            value={c.deadline ?? "-"}
          />
        </div>

<div className="flex justify-end mt-4">
  <button
    onClick={() => setShowPaymentForm(true)}
    className="h-10 px-5 rounded-lg text-sm font-medium"
    style={{
      backgroundColor: "var(--accent-yellow)",
      color: "#0a0a0a",
    }}
  >
    Registrer betaling
  </button>
</div>

<div
  className="rounded-2xl p-5 mt-4"
  style={{ backgroundColor: "var(--bg-secondary)" }}
>
  <h2
    className="text-sm font-semibold mb-4"
    style={{ color: "var(--text-primary)" }}
  >
    Betalingshistorikk
  </h2>

  {data.finance.filter((f: any) => f.status === "paid").length === 0 ? (
    <p
      className="text-sm"
      style={{ color: "var(--text-secondary)" }}
    >
      Ingen registrerte betalinger.
    </p>
  ) : (
    <div className="space-y-3">
      {data.finance
        .filter((f: any) => f.status === "paid")
        .map((payment: any) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-xl p-3"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <div>
              <div
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {payment.paidDate ?? "-"}
              </div>

              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {payment.notes ?? "Ingen kommentar"}
              </div>
            </div>

            <div
              className="text-sm font-semibold"
              style={{ color: "var(--accent-green)" }}
            >
              {Number(
                payment.originalAmount ??
                payment.currentAmount ??
                0
              ).toLocaleString("nb-NO")} kr
            </div>
          </div>
        ))}
    </div>
  )}
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

     <div className="flex flex-col gap-6">
        <section className="rounded-2xl p-5 overflow-y-auto" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            <FileText size={18} /> Dokumenter ({data.statistics.documentCount})
          </h2>

          <div className="space-y-3">
            {data.documents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ingen dokumenter.</p>
            ) : (
data.documents.map((doc: any) => {
  const documentUrl = doc.fileUrl
    ? String(doc.fileUrl).startsWith("/")
      ? doc.fileUrl
      : `/${doc.fileUrl}`
    : null;

  return (
    <div
      key={doc.id}
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {doc.fileName ?? "Dokument"}
          </p>

          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {doc.detectedType ?? "Ukjent"} · {doc.createdAt}
          </p>
        </div>

        {documentUrl && (
          <button
            type="button"
            onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium shrink-0"
            style={{
              backgroundColor: "var(--accent-yellow)",
              color: "#0a0a0a",
            }}
          >
            <ExternalLink size={15} />
            Åpne dokument
          </button>
        )}
      </div>

      {!documentUrl && (
        <p
          className="text-xs mt-3"
          style={{ color: "var(--accent-red)" }}
        >
          Dokumentet mangler filsti.
        </p>
      )}
    </div>
  );
})
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

       <section
  className="rounded-2xl p-5 overflow-y-auto"
  style={{ backgroundColor: "var(--bg-secondary)" }}
>
  <h2
    className="flex items-center gap-2 text-sm font-semibold mb-4"
    style={{ color: "var(--text-primary)" }}
  >
    <Bot size={18} /> Saksdetaljer
  </h2>

  <div className="space-y-4 text-sm">
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Info label="Kreditor" value={displayedCreditor} />
<Info
  label="Inkassobyrå"
  value={displayedCollectionAgency}
/>
<Info label="Offentlig instans" value={c.publicAuthority} />
<Info label="Status" value={c.status} />
<Info label="Prioritet" value={c.priority} />
<Info label="Frist" value={displayedDeadline} />
<Info
  label="Referanse"
  value={displayedReference}
/>
    </div>

    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3
          className="text-xs uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          Notater
        </h3>

        <span
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {data.statistics.noteCount ?? 0}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
  <textarea
    value={newCaseNote}
    onChange={(e) => setNewCaseNote(e.target.value)}
    placeholder="Skriv et notat om saken..."
    rows={3}
    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
    style={{
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-color)",
    }}
  />

  <button
    type="button"
    onClick={() => {
      const note = newCaseNote.trim();

      if (!caseId || !note) {
        return;
      }

      addNote.mutate({
        caseId,
        note,
      });
    }}
    disabled={addNote.isPending || !newCaseNote.trim()}
    className="w-full h-9 rounded-lg text-sm font-medium"
    style={{
      backgroundColor: "var(--accent-yellow)",
      color: "#0a0a0a",
      opacity:
        addNote.isPending || !newCaseNote.trim()
          ? 0.6
          : 1,
    }}
  >
    {addNote.isPending ? "Lagrer..." : "Legg til notat"}
  </button>

  {addNote.error && (
    <p
      className="text-xs"
      style={{ color: "var(--accent-red)" }}
    >
      {addNote.error.message}
    </p>
  )}
</div>


      {(data.notes ?? []).length === 0 ? (
        <p
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Ingen notater ennå.
        </p>
      ) : (
        <div className="space-y-3">
          {(data.notes ?? []).map((note: any) => (
            <div
              key={note.id}
              className="rounded-lg p-3"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--text-primary)" }}
              >
                {note.note}
              </p>

              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {note.createdAt
                  ? new Date(note.createdAt).toLocaleString("nb-NO")
                  : "Ukjent tidspunkt"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <h3
        className="text-xs uppercase mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        AI-oppsummering
      </h3>

      <p
        className="whitespace-pre-wrap"
        style={{ color: "var(--text-primary)" }}
      >
        {data.aiSummary ?? "Ingen AI-oppsummering ennå."}
      </p>
    </div>
  </div>
</section>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <p
        className="text-xs uppercase mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {title}
      </p>

      <p
        className="text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
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