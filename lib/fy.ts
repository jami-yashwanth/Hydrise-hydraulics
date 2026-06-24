export function getCurrentFY(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 4) return `${year}-${(year + 1).toString().slice(2)}`
  return `${year - 1}-${year.toString().slice(2)}`
}

export function parseFY(fy: string): { start: Date; end: Date } {
  const startYear = parseInt(fy.split("-")[0])
  return {
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999),
  }
}

// Returns all yyyy-MM strings within the FY (Apr–Mar)
export function fyMonths(fy: string): string[] {
  const startYear = parseInt(fy.split("-")[0])
  const months: string[] = []
  for (let m = 4; m <= 12; m++) {
    months.push(`${startYear}-${String(m).padStart(2, "0")}`)
  }
  for (let m = 1; m <= 3; m++) {
    months.push(`${startYear + 1}-${String(m).padStart(2, "0")}`)
  }
  return months
}

// Clamp month to stay within the FY; defaults to the last month of the FY
export function clampMonthToFY(month: string, fy: string): string {
  const months = fyMonths(fy)
  if (months.includes(month)) return month
  return months[months.length - 1]
}

// Default month for a given FY: current month if within FY, else last month of FY
export function defaultMonthForFY(fy: string): string {
  const months = fyMonths(fy)
  if (fy === getCurrentFY()) {
    const now = new Date()
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    if (months.includes(cur)) return cur
  }
  return months[months.length - 1]
}

// Returns FY strings newest-first, e.g. ["2026-27", "2025-26", ...]
export function getFYList(fromYear = 2023): string[] {
  const currentStartYear = parseInt(getCurrentFY().split("-")[0])
  const fys: string[] = []
  for (let y = fromYear; y <= currentStartYear; y++) {
    fys.push(`${y}-${(y + 1).toString().slice(2)}`)
  }
  return fys.reverse()
}
