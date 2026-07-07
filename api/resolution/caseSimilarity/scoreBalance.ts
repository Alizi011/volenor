export function scoreBalance(
  incoming: number | null | undefined,
  existing: number | null | undefined
) {
  if (
    incoming == null ||
    existing == null
  ) {
    return 0;
  }

  const diff = Math.abs(
    Number(incoming) - Number(existing)
  );

  if (diff <= 1) {
    return 15;
  }

  return 0;
}