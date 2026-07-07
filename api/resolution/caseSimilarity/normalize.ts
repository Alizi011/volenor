export function normalize(value?: string | null) {
  if (!value) return "";

  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:()]/g, "");
}