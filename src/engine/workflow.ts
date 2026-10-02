// Workflow helpers: step ordering, next-action resolution, and derived case helpers.
import type { ActionType, Case, CaseStatus, NextAction, ServiceKey } from '@/types'

export interface WorkflowStep {
  key: string
  label: string
  statuses: CaseStatus[]
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: 'received', label: 'Received', statuses: ['new'] },
  { key: 'assessed', label: 'Assessed', statuses: ['assessed', 'facility_recommended'] },
  { key: 'facility', label: 'Facility', statuses: ['facility_recommended', 'referral_pending'] },
  { key: 'referral', label: 'Referral', statuses: ['referral_pending', 'referral_accepted', 'referral_declined'] },
  { key: 'transport', label: 'Transport', statuses: ['referral_accepted', 'transport_assigned', 'in_transit', 'transport_delayed'] },
  { key: 'arrived', label: 'Arrived', statuses: ['in_transit', 'arrived'] },
  { key: 'followup', label: 'Follow-up', statuses: ['arrived', 'followup_due', 'followup_overdue', 'followup_completed'] },
  { key: 'complete', label: 'Complete', statuses: ['followup_completed'] },
]

/** Index of the furthest workflow step this status has reached. */
export function stepIndexFor(status: CaseStatus): number {
  switch (status) {
    case 'new': return 0
    case 'assessed': return 1
    case 'facility_recommended': return 2
    case 'referral_pending': return 3
    case 'referral_accepted': return 4
    case 'transport_assigned': return 4
    case 'in_transit': return 5
    case 'transport_delayed': return 4
    case 'arrived': return 6
    case 'followup_due': return 6
    case 'followup_overdue': return 6
    case 'followup_completed': return 7
    case 'facility_unavailable': return 1
    case 'referral_declined': return 3
    default: return 0
  }
}

/** Statuses that represent a blocked / failed step. */
export const BLOCKED_STATUSES: CaseStatus[] = ['facility_unavailable', 'referral_declined', 'transport_delayed', 'followup_overdue']

export function isBlocked(status: CaseStatus): boolean {
  return BLOCKED_STATUSES.includes(status)
}

export function isActive(status: CaseStatus): boolean {
  return status !== 'followup_completed'
}

/** The single deterministic next action for a case. */
export function nextActionFor(caseItem: Case): NextAction {
  const s = caseItem.status
  switch (s) {
    case 'new':
      return { type: 'run_assessment', label: 'Complete Assessment', description: 'Confirm the administrative details to calculate priority and facility matches.' }
    case 'assessed':
    case 'facility_recommended':
      return {
        type: 'confirm_facility',
        label: 'Confirm Facility',
        description: nextFacilityDescription(caseItem),
      }
    case 'facility_unavailable':
      return { type: 'choose_alternative', label: 'Choose Another Facility', description: 'The selected facility is no longer available. Review the next eligible facility below.' }
    case 'referral_pending':
      return { type: 'mark_accepted', label: 'Mark Referral Accepted', description: 'Facility confirmed. Waiting for facility acceptance.' }
    case 'referral_declined':
      return { type: 'confirm_facility', label: 'Choose Another Facility', description: nextFacilityDescription(caseItem) }
    case 'referral_accepted':
      return { type: 'request_transport', label: 'Request Transport', description: 'Referral accepted. This case needs assisted transport — request it before departure.' }
    case 'transport_assigned':
      if (caseItem.transport.status === 'requested') {
        return { type: 'assign_transport', label: assignLabel(caseItem), description: 'Choose an available resource that supports assisted transport.' }
      }
      return { type: 'start_transport', label: 'Start Transport', description: `${resourceName(caseItem)} is assigned and ready. Depart when the patient is prepared.` }
    case 'transport_delayed':
      return { type: 'assign_transport', label: 'Retry Transport', description: 'Transport was delayed. Retry with an available resource or use an alternative.' }
    case 'in_transit':
      return { type: 'mark_arrived', label: 'Mark Arrived', description: `${resourceName(caseItem)} is en route. Mark arrival when the patient reaches the facility.` }
    case 'arrived':
      return { type: 'schedule_followup', label: 'Schedule Follow-up', description: 'Patient has arrived. Schedule the follow-up visit.' }
    case 'followup_due':
    case 'followup_overdue':
      return { type: 'complete_followup', label: 'Mark Follow-up Complete', description: 'Follow-up is scheduled. Mark it complete once the coordinator confirms the visit.' }
    case 'followup_completed':
      return { type: 'none', label: 'Complete', description: 'Referral journey finished. No further coordination steps.' }
    default:
      return { type: 'none', label: '—', description: '' }
  }
}

function assignLabel(caseItem: Case): string {
  return caseItem.transport.resourceId ? 'Assign Transport' : 'Assign Transport'
}

function resourceName(caseItem: Case): string {
  return caseItem.transport.resourceId ?? 'Transport'
}

function nextFacilityDescription(caseItem: Case): string {
  return caseItem.selectedFacilityId
    ? 'A suitable facility has been selected. Confirm it to create the referral.'
    : 'Review the recommendation and confirm the highest-scoring eligible facility.'
}

/** Short label for the attention queue / cases table. */
export function nextActionLabel(caseItem: Case): string {
  const action = nextActionFor(caseItem)
  return action.label
}

export const ACTION_TYPES: ActionType[] = [
  'run_assessment',
  'confirm_facility',
  'choose_alternative',
  'mark_accepted',
  'request_transport',
  'assign_transport',
  'start_transport',
  'mark_arrived',
  'schedule_followup',
  'complete_followup',
  'none',
]

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  maternity: 'Maternity & Obstetric Services',
  emergency: 'Emergency Services',
  imaging: 'Imaging Services',
  specialist: 'Specialist Consultation',
  pediatric: 'Pediatric Services',
  basic: 'Basic Health Services',
  minor_injury: 'Minor Injury Care',
  chronic: 'Chronic Condition Review',
  mental_health: 'Mental Wellbeing Support',
}
