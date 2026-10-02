// Deterministic demo clock helpers. Business logic never uses Date.now().
import type { AppState } from '@/types'

export const DEMO_EPOCH = '2025-01-15T10:30:00'

export function parse(ts: string): Date {
  return new Date(ts)
}

export function iso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function addMinutes(ts: string, minutes: number): string {
  const d = parse(ts)
  d.setMinutes(d.getMinutes() + minutes)
  return iso(d)
}

export function addHours(ts: string, hours: number): string {
  const d = parse(ts)
  d.setHours(d.getHours() + hours)
  return iso(d)
}

export function addDays(ts: string, days: number): string {
  const d = parse(ts)
  d.setDate(d.getDate() + days)
  return iso(d)
}

/** Advance the shared demo clock. */
export function advanceClock(state: AppState, days: number): AppState {
  return { ...state, demoNow: addDays(state.demoNow, days) }
}

/** "10:42" style clock time. */
export function clockTime(ts: string): string {
  const d = parse(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "Wed, Jan 15 · 10:42" */
export function dateTimeLabel(ts: string): string {
  const d = parse(ts)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} · ${clockTime(ts)}`
}

/** "Jan 14 · 18:05" — no weekday, for compact table cells. */
export function shortDateTime(ts: string): string {
  const d = parse(ts)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()} · ${clockTime(ts)}`
}

/** Deterministic "x min ago / x h ago / x d ago" relative to the demo clock. */
export function relativeTime(ts: string, demoNow: string): string {
  const diffMin = Math.round((parse(demoNow).getTime() - parse(ts).getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h ${diffMin % 60} m ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} d ago`
}

/** Whole minutes between two timestamps (a - b). */
export function minutesBetween(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 60000)
}

/** Deterministic facility open check at demo time. */
export function isOpenAt(facility: { alwaysOpen: boolean; openTime: string; closeTime: string }, demoNow: string): boolean {
  if (facility.alwaysOpen) return true
  const d = parse(demoNow)
  const minutes = d.getHours() * 60 + d.getMinutes()
  const [oh, om] = facility.openTime.split(':').map(Number)
  const [ch, cm] = facility.closeTime.split(':').map(Number)
  return minutes >= oh * 60 + om && minutes < ch * 60 + cm
}

/** Deterministic: is the given timestamp before the demo clock? */
export function isPast(ts: string, demoNow: string): boolean {
  return parse(ts).getTime() < parse(demoNow).getTime()
}

/** Whole days overdue relative to demo clock. */
export function daysOverdue(dueTs: string, demoNow: string): number {
  return Math.floor(minutesBetween(demoNow, dueTs) / 1440)
}

/** Human label like "Due tomorrow" / "Due today · 15:30" / "Overdue by 2 days". */
export function dueLabel(dueTs: string, demoNow: string): string {
  const diffMin = minutesBetween(dueTs, demoNow)
  if (diffMin < 0) {
    const d = daysOverdue(dueTs, demoNow)
    return d >= 1 ? `Overdue by ${d} day${d === 1 ? '' : 's'}` : `Overdue · due ${clockTime(dueTs)}`
  }
  if (diffMin < 60) return `Due in ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  const sameDay = parse(dueTs).toDateString() === parse(demoNow).toDateString()
  if (sameDay) return diffH === 0 ? `Due today · ${clockTime(dueTs)}` : `Due in ${diffH} h`
  const tomorrow = addDays(demoNow, 1)
  if (parse(dueTs).toDateString() === parse(tomorrow).toDateString()) return 'Due tomorrow'
  return `Due in ${Math.floor(diffH / 24)} days`
}
