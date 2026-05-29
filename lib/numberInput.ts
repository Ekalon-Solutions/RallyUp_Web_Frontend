export function formatNumberInputValue(value: number): string | number {
  return value === 0 ? "" : value
}

export function parseOptionalNonNegativeNumber(raw: string): number {
  if (raw === "" || raw === "-") return 0
  const n = Number(raw)
  if (Number.isNaN(n)) return 0
  return Math.max(0, n)
}

export function parseOptionalNonNegativeInt(raw: string): number {
  if (raw === "" || raw === "-") return 0
  const n = Number(raw)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.floor(n))
}
