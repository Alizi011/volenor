export function scoreReference(
  incoming: string | null | undefined,
  existing: string | null | undefined
) {
  if (!incoming || !existing) {
    return 0;
  }

  return incoming === existing ? 100 : 0;
}