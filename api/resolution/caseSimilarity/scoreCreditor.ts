import { normalize } from "./normalize";

export function scoreCreditor(
  incoming: string | null | undefined,
  existing: string | null | undefined
) {
  if (!incoming || !existing) {
    return 0;
  }

  return normalize(incoming) === normalize(existing)
    ? 35
    : 0;
}