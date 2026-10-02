import type { CaseStatus, FollowUpStatus, Priority, ReferralStatus, TransportStatus } from '@/types'
import { priorityLabel } from '@/engine/priority'

export function PriorityBadge({
  level,
  score,
  size = 'md',
}: {
  level: Priority
  score?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const styles: Record<Priority, string> = {
    urgent: 'bg-urgent-bg text-urgent ring-urgent/25',
    priority: 'bg-priority-bg text-priority ring-priority/25',
    routine: 'bg-routine-bg text-routine ring-routine/20',
  }
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold uppercase tracking-wider ring-1 ring-inset tabular ${styles[level]} ${sizes[size]}`}
    >
      {priorityLabel(level)}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  )
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'New',
  assessed: 'Assessed',
  facility_recommended: 'Facility recommended',
  referral_pending: 'Referral pending',
  referral_accepted: 'Referral accepted',
  transport_assigned: 'Transport assigned',
  in_transit: 'In transit',
  arrived: 'Arrived',
  followup_due: 'Follow-up due',
  followup_completed: 'Completed',
  facility_unavailable: 'Facility unavailable',
  transport_delayed: 'Transport delayed',
  referral_declined: 'Referral declined',
  followup_overdue: 'Follow-up overdue',
}

const STATUS_STYLES: Record<CaseStatus, string> = {
  new: 'bg-teal-50 text-teal-700 ring-teal-300',
  assessed: 'bg-teal-50 text-teal-700 ring-teal-300',
  facility_recommended: 'bg-teal-50 text-teal-700 ring-teal-300',
  referral_pending: 'bg-priority-bg text-priority ring-priority/25',
  referral_accepted: 'bg-success-bg text-success ring-success/25',
  transport_assigned: 'bg-teal-50 text-teal-700 ring-teal-300',
  in_transit: 'bg-teal-50 text-teal-700 ring-teal-300',
  arrived: 'bg-success-bg text-success ring-success/25',
  followup_due: 'bg-priority-bg text-priority ring-priority/25',
  followup_completed: 'bg-success-bg text-success ring-success/25',
  facility_unavailable: 'bg-urgent-bg text-urgent ring-urgent/25',
  transport_delayed: 'bg-urgent-bg text-urgent ring-urgent/25',
  referral_declined: 'bg-urgent-bg text-urgent ring-urgent/25',
  followup_overdue: 'bg-urgent-bg text-urgent ring-urgent/25',
}

export function StatusBadge({ status, size = 'md' }: { status: CaseStatus; size?: 'sm' | 'md' }) {
  const sizes = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ring-1 ring-inset ${STATUS_STYLES[status]} ${sizes}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function statusLabel(status: CaseStatus): string {
  return STATUS_LABELS[status]
}

export function ReferralBadge({ status }: { status: ReferralStatus }) {
  const map = {
    pending: { label: 'Pending', cls: 'bg-priority-bg text-priority ring-priority/25' },
    accepted: { label: 'Accepted', cls: 'bg-success-bg text-success ring-success/25' },
    declined: { label: 'Declined', cls: 'bg-urgent-bg text-urgent ring-urgent/25' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function TransportBadge({ status }: { status: TransportStatus }) {
  const map: Record<TransportStatus, { label: string; cls: string }> = {
    not_requested: { label: 'Not requested', cls: 'bg-routine-bg text-routine ring-routine/20' },
    requested: { label: 'Requested', cls: 'bg-priority-bg text-priority ring-priority/25' },
    assigned: { label: 'Assigned', cls: 'bg-teal-50 text-teal-700 ring-teal-300' },
    en_route: { label: 'En route', cls: 'bg-teal-50 text-teal-700 ring-teal-300' },
    arrived: { label: 'Arrived', cls: 'bg-success-bg text-success ring-success/25' },
    delayed: { label: 'Delayed', cls: 'bg-urgent-bg text-urgent ring-urgent/25' },
    unavailable: { label: 'Unavailable', cls: 'bg-urgent-bg text-urgent ring-urgent/25' },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const map = {
    not_scheduled: { label: 'Not scheduled', cls: 'bg-routine-bg text-routine ring-routine/20' },
    scheduled: { label: 'Scheduled', cls: 'bg-teal-50 text-teal-700 ring-teal-300' },
    completed: { label: 'Completed', cls: 'bg-success-bg text-success ring-success/25' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}
