import { normalize } from "./normalize";

export function scoreAgency(
  incoming: string | null | undefined,
  existing: string | null | undefined
) {
  if (!incoming || !existing) {
    return 0;
  }

  return normalize(incoming) === normalize(existing)
    ? 25
    : 0;
}