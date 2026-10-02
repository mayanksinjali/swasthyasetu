// Deterministic, pure priority engine — demo coordination rules, not clinical advice.
import type { Case, Facility, Priority, PriorityAssessment, PriorityReason } from '@/types'
import { matchFacilities } from './matching'

export interface PriorityRule {
  key: string
  label: string
  points: number
}

/** The full rules table, shown in the "How is this calculated?" expandable. */
export const PRIORITY_RULES: { group: string; rows: PriorityRule[] }[] = [
  {
    group: 'Time sensitivity',
    rows: [
      { key: 'same_day', label: 'Same-day coordination required', points: 40 },
      { key: 'within_48h', label: 'Coordination within 48 hours', points: 20 },
      { key: 'flexible', label: 'Flexible timing', points: 0 },
    ],
  },
  {
    group: 'Referral & services',
    rows: [
      { key: 'referral', label: 'Referral to professional care required', points: 15 },
      { key: 'specialized', label: 'Specialized service required', points: 10 },
    ],
  },
  {
    group: 'Facility availability',
    rows: [
      { key: 'fac_01', label: '0–1 suitable facilities available', points: 15 },
      { key: 'fac_2', label: '2 suitable facilities available', points: 8 },
      { key: 'fac_3p', label: '3+ suitable facilities available', points: 0 },
    ],
  },
  {
    group: 'Transport & access',
    rows: [
      { key: 'assisted', label: 'Assisted transport required', points: 10 },
      { key: 'remote', label: 'Remote location', points: 8 },
      { key: 'no_constraint', label: 'No transport constraint', points: 0 },
    ],
  },
  {
    group: 'Follow-up urgency',
    rows: [
      { key: 'fu_24h', label: 'Follow-up needed within 24 hours of arrival', points: 10 },
      { key: 'fu_week', label: 'Follow-up needed within a week', points: 5 },
      { key: 'fu_routine', label: 'Routine follow-up', points: 0 },
    ],
  },
]

export function priorityLevel(score: number): Priority {
  if (score >= 70) return 'urgent'
  if (score >= 40) return 'priority'
  return 'routine'
}

/**
 * Pure, deterministic. scoreFor is split out so the dashboard can score a case
 * against the *current* facility state without recomputing the full assessment.
 */
export function computePriority(
  caseItem: Case,
  facilities: Facility[],
  demoNow: string,
): PriorityAssessment {
  const eligibleCount = matchFacilities(caseItem, facilities, demoNow).eligible.length
  return scoreFor(caseItem, eligibleCount, demoNow)
}

export function scoreFor(
  caseItem: Case,
  suitableFacilityCount: number,
  demoNow: string,
): PriorityAssessment {
  const reasons: PriorityReason[] = []
  let score = 0

  // Time sensitivity
  if (caseItem.factors.timeSensitivity === 'same_day') {
    score += 40
    reasons.push({ label: 'Time-sensitive referral (same-day)', points: 40 })
  } else if (caseItem.factors.timeSensitivity === 'within_48h') {
    score += 20
    reasons.push({ label: 'Time-sensitive referral (within 48 hours)', points: 20 })
  }

  // Referral required
  if (caseItem.factors.referralRequired) {
    score += 15
    reasons.push({ label: 'Referral to professional care required', points: 15 })
  }

  // Specialized service
  if (caseItem.factors.specializedServiceNeeded) {
    score += 10
    reasons.push({
      label: `Specialized service required: ${caseItem.requiredServiceLabel}`,
      points: 10,
    })
  }

  // Facility availability
  if (suitableFacilityCount <= 1) {
    score += 15
    reasons.push({
      label: `Very limited suitable facility availability (${suitableFacilityCount} eligible)`,
      points: 15,
    })
  } else if (suitableFacilityCount === 2) {
    score += 8
    reasons.push({
      label: `Limited suitable facility availability (${suitableFacilityCount} eligible)`,
      points: 8,
    })
  }

  // Transport & access
  if (caseItem.factors.transportConstraint === 'needs_assisted_transport') {
    score += 10
    reasons.push({ label: 'Assisted transport required', points: 10 })
  }
  if (caseItem.factors.transportConstraint === 'remote_location') {
    score += 8
    reasons.push({ label: 'Remote location — longer coordination path', points: 8 })
  }

  // Follow-up urgency
  if (caseItem.factors.followUpUrgency === 'within_24h') {
    score += 10
    reasons.push({ label: 'Follow-up needed within 24 hours of arrival', points: 10 })
  } else if (caseItem.factors.followUpUrgency === 'within_week') {
    score += 5
    reasons.push({ label: 'Follow-up needed within a week', points: 5 })
  }

  return {
    level: priorityLevel(score),
    score,
    reasons,
    eligibleFacilityCount: suitableFacilityCount,
    assessedAt: demoNow,
  }
}

/** Human-readable level label. */
export function priorityLabel(level: Priority): string {
  return level === 'urgent' ? 'URGENT' : level === 'priority' ? 'PRIORITY' : 'ROUTINE'
}
