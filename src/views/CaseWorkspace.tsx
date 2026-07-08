import { useCaseWorkspace } from "@/hooks/useCaseWorkspace";

interface CaseWorkspaceProps {
  caseId: number | null;
  onBack?: () => void;
}

export default function CaseWorkspace({ caseId, onBack }: CaseWorkspaceProps) {
  const { data, isLoading, error } = useCaseWorkspace(caseId);

  if (!caseId) {
    return <div style={{ padding: 24 }}>Ingen sak valgt.</div>;
  }

  if (isLoading) {
    return <div style={{ padding: 24 }}>Laster sak...</div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}>Feil: {error.message}</div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}>Ingen data.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 h-9 px-4 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          }}
        >
          Tilbake
        </button>
      )}

      <h1>{data.case.caseNumber} · {data.case.title}</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}