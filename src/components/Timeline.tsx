import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Building2,
  Ambulance,
  PhoneIncoming,
  Route,
} from 'lucide-react'
import type { EventKind, TimelineEvent } from '@/types'
import { clockTime } from '@/engine/time'

const KIND_ICON: Record<EventKind, typeof Clock> = {
  received: PhoneIncoming,
  assessment: ClipboardList,
  facility: Building2,
  referral: Building2,
  transport: Ambulance,
  arrival: Route,
  followup: CheckCircle2,
  alert: AlertTriangle,
  complete: CheckCircle2,
}

const KIND_COLOR: Record<EventKind, string> = {
  received: 'bg-teal-100 text-teal-700',
  assessment: 'bg-teal-100 text-teal-700',
  facility: 'bg-teal-100 text-teal-700',
  referral: 'bg-teal-100 text-teal-700',
  transport: 'bg-teal-100 text-teal-700',
  arrival: 'bg-teal-100 text-teal-700',
  followup: 'bg-success-bg text-success',
  alert: 'bg-urgent-bg text-urgent',
  complete: 'bg-success-bg text-success',
}

export function Timeline({ events, compact = false }: { events: TimelineEvent[]; compact?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <ol className="relative space-y-0">
      <AnimatePresence initial={false}>
        {events.map((e, i) => {
          const Icon = KIND_ICON[e.kind] ?? Clock
          const last = i === events.length - 1
          return (
            <motion.li
              key={e.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              {!last && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line" aria-hidden />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-line ${KIND_COLOR[e.kind]}`}>
                <Icon size={14} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-xs font-semibold text-ink">{clockTime(e.at)}</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{e.actor}</span>
                </div>
                <p className={`mt-0.5 text-[13px] leading-snug text-ink-2 ${compact ? 'truncate' : ''}`}>{e.message}</p>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
      {events.length === 0 && <li className="py-4 text-sm text-muted">No activity yet.</li>}
    </ol>
  )
}
