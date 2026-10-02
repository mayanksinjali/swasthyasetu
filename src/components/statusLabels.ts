import type { CaseStatus } from '@/types'

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

export function statusText(status: CaseStatus): string {
  return STATUS_LABELS[status]
}
