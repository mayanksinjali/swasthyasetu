// ─── Core domain types ────────────────────────────────────────────────────────

export type Priority = 'routine' | 'priority' | 'urgent'

export type CaseStatus =
  | 'new'
  | 'assessed'
  | 'facility_recommended'
  | 'referral_pending'
  | 'referral_accepted'
  | 'transport_assigned'
  | 'in_transit'
  | 'arrived'
  | 'followup_due'
  | 'followup_completed'
  | 'facility_unavailable'
  | 'transport_delayed'
  | 'referral_declined'
  | 'followup_overdue'

export type ReferralCategory =
  | 'maternal_care'
  | 'imaging'
  | 'specialist'
  | 'chronic_review'
  | 'pediatric'
  | 'general'

export type ServiceKey =
  | 'maternity'
  | 'emergency'
  | 'imaging'
  | 'specialist'
  | 'pediatric'
  | 'basic'
  | 'minor_injury'
  | 'chronic'
  | 'mental_health'

export type TransportStatus =
  | 'not_requested'
  | 'requested'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'delayed'
  | 'unavailable'

export type ReferralStatus = 'pending' | 'accepted' | 'declined'

export type FollowUpStatus = 'not_scheduled' | 'scheduled' | 'completed'

export type TimeSensitivity = 'same_day' | 'within_48h' | 'flexible'

export type TransportConstraint = 'needs_assisted_transport' | 'remote_location' | 'none'

export type FollowUpUrgency = 'within_24h' | 'within_week' | 'routine'

export interface PriorityFactors {
  timeSensitivity: TimeSensitivity
  referralRequired: boolean
  specializedServiceNeeded: boolean
  transportConstraint: TransportConstraint
  followUpUrgency: FollowUpUrgency
}

export interface PriorityReason {
  label: string
  points: number
}

export interface PriorityAssessment {
  level: Priority
  score: number
  reasons: PriorityReason[]
  eligibleFacilityCount: number
  assessedAt: string
}

export interface CaseContext {
  reportedBy: string
  mobility: string
  timeSensitivity: string
  caregiverAvailable: string
  administrativeStatus: string
}

export interface TransportAssignment {
  status: TransportStatus
  resourceId?: string
  etaMinutes?: number
  requestedAt?: string
  assignedAt?: string
  startedAt?: string
  arrivedAt?: string
  note?: string
}

export interface FollowUpRecord {
  status: FollowUpStatus
  scheduledFor?: string
  completedAt?: string
}

export interface Case {
  id: string
  patientAlias: string
  ageBand: string
  location: string
  category: ReferralCategory
  categoryLabel: string
  requiredService: ServiceKey
  requiredServiceLabel: string
  summary: string
  context: CaseContext
  factors: PriorityFactors
  status: CaseStatus
  priority?: PriorityAssessment
  receivedAt: string
  selectedFacilityId?: string
  referral?: { status: ReferralStatus; createdAt?: string; resolvedAt?: string }
  transport: TransportAssignment
  followUp: FollowUpRecord
  declinedFacilityIds: string[]
}

export type FacilityStatus = 'available' | 'limited' | 'unavailable'

export interface Facility {
  id: string
  name: string
  location: string
  distanceKm: number
  services: ServiceKey[]
  status: FacilityStatus
  acceptingReferrals: boolean
  alwaysOpen: boolean
  openTime: string // "07:00"
  closeTime: string // "20:00"
  bedsTotal: number
  bedsOccupied: number
}

export type TransportResourceType = 'ambulance' | 'van' | 'motorbike'

export interface TransportResource {
  id: string
  name: string
  type: TransportResourceType
  status: 'available' | 'busy' | 'offline'
  etaMinutes?: number
  supportsAssisted: boolean
  assignedCaseId?: string
  reservedForCaseId?: string
  note?: string
}

export type Actor = 'Coordinator' | 'Facility' | 'Transport' | 'System'

export type EventKind =
  | 'received'
  | 'assessment'
  | 'facility'
  | 'referral'
  | 'transport'
  | 'arrival'
  | 'followup'
  | 'alert'
  | 'complete'

export interface TimelineEvent {
  id: string
  caseId: string
  at: string
  actor: Actor
  message: string
  kind: EventKind
}

// ─── Engine result types ──────────────────────────────────────────────────────

export type MatchFactorKey = 'service' | 'availability' | 'distance' | 'capacity' | 'hours'

export interface MatchFactor {
  key: MatchFactorKey
  label: string
  earned: number
  max: number
}

export interface FacilityMatch {
  facility: Facility
  score: number
  factors: MatchFactor[]
}

export type ExclusionReason =
  | 'No required service at this facility'
  | 'Currently unavailable'
  | 'Not accepting referrals'
  | 'Previously declined this referral'
  | 'Closed at this time'
  | 'At full capacity'

export interface ExcludedFacility {
  facility: Facility
  reason: ExclusionReason
}

export interface MatchResult {
  eligible: FacilityMatch[]
  excluded: ExcludedFacility[]
}

export type ActionType =
  | 'run_assessment'
  | 'confirm_facility'
  | 'choose_alternative'
  | 'mark_accepted'
  | 'request_transport'
  | 'assign_transport'
  | 'start_transport'
  | 'mark_arrived'
  | 'schedule_followup'
  | 'complete_followup'
  | 'none'

export interface NextAction {
  type: ActionType
  label: string
  description: string
}

// ─── Shared state ─────────────────────────────────────────────────────────────

export interface AppState {
  demoNow: string
  cases: Case[]
  facilities: Facility[]
  transportResources: TransportResource[]
  timeline: TimelineEvent[]
}
