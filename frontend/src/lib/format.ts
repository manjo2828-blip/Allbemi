const parts = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hourCycle: 'h23', ...opts })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  )

/** 2026-04-08 (화면에서만 KST로 변환) */
export function formatDate(iso: string): string {
  const p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

/** 09:12 */
export function formatTime(iso: string): string {
  const p = parts(iso, { hour: '2-digit', minute: '2-digit' })
  return `${p.hour}:${p.minute}`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
