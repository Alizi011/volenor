import { trpc } from "@/providers/trpc";

export function useCaseWorkspace(caseId: number | null) {
  return trpc.synapse.workspace.get.useQuery(
    { caseId: caseId ?? 0 },
    {
      enabled: !!caseId,
    },
  );
}