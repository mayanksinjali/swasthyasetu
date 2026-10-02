// Deterministic, pure facility matching engine.
import type {
  Case,
  ExcludedFacility,
  ExclusionReason,
  Facility,
  FacilityMatch,
  MatchFactor,
  MatchResult,
} from '@/types'
import { isOpenAt } from './time'

/** Service match — max 35. Required service present at the facility. */
function serviceScore(caseItem: Case, facility: Facility): number {
  return facility.services.includes(caseItem.requiredService) ? 35 : 0
}

/** Availability — max 25 (full 25 when available, 15 limited). */
function availabilityScore(facility: Facility): number {
  return facility.status === 'available' ? 25 : facility.status === 'limited' ? 15 : 0
}

/**
 * Distance — max 20. Deterministic decay:
 *   ≤3 km  → 18 (golden case, tuned)
 *   ≤6 km  → 16
 *   ≤10 km → 12
 *   ≤12 km → 9
 *   ≤15 km → 8
 *   else   → 4
 */
function distanceScore(distanceKm: number): number {
  if (distanceKm <= 3) return 18
  if (distanceKm <= 6) return 16
  if (distanceKm <= 10) return 12
  if (distanceKm <= 12) return 9
  if (distanceKm <= 15) return 8
  return 4
}

/** Capacity — max 10, proportional to free beds: free/total × 10, min 2. */
function capacityScore(facility: Facility): number {
  const free = Math.max(0, facility.bedsTotal - facility.bedsOccupied)
  if (free === 0) return 0
  return Math.max(2, Math.round((free / facility.bedsTotal) * 10))
}

/** Operating hours — max 10 (full 10 for 24/7, 6 open now with day schedule, 0 closed). */
function hoursScore(facility: Facility, demoNow: string): number {
  if (facility.alwaysOpen) return 10
  return isOpenAt(facility, demoNow) ? 6 : 0
}

export const FACTOR_LABELS: Record<string, string> = {
  service: 'Service match',
  availability: 'Available',
  distance: 'Nearby',
  capacity: 'Capacity',
  hours: 'Open now',
}

/** Hard filters + scoring. Pure & deterministic — same inputs, same ranking. */
export function matchFacilities(caseItem: Case, facilities: Facility[], demoNow: string): MatchResult {
  const eligible: FacilityMatch[] = []
  const excluded: ExcludedFacility[] = []

  for (const facility of facilities) {
    let reason: ExclusionReason | null = null

    if (!facility.services.includes(caseItem.requiredService)) {
      reason = 'No required service at this facility'
    } else if (caseItem.declinedFacilityIds.includes(facility.id)) {
      reason = 'Previously declined this referral'
    } else if (facility.status === 'unavailable') {
      reason = 'Currently unavailable'
    } else if (!facility.acceptingReferrals) {
      reason = 'Not accepting referrals'
    } else if (facility.bedsTotal - facility.bedsOccupied <= 0) {
      reason = 'At full capacity'
    } else if (!isOpenAt(facility, demoNow)) {
      reason = 'Closed at this time'
    }

    if (reason) {
      excluded.push({ facility, reason })
      continue
    }

    const factors: MatchFactor[] = [
      { key: 'service', label: FACTOR_LABELS.service, earned: serviceScore(caseItem, facility), max: 35 },
      { key: 'availability', label: FACTOR_LABELS.availability, earned: availabilityScore(facility), max: 25 },
      { key: 'distance', label: FACTOR_LABELS.distance, earned: distanceScore(facility.distanceKm), max: 20 },
      { key: 'capacity', label: FACTOR_LABELS.capacity, earned: capacityScore(facility), max: 10 },
      { key: 'hours', label: FACTOR_LABELS.hours, earned: hoursScore(facility, demoNow), max: 10 },
    ]
    const score = factors.reduce((sum, f) => sum + f.earned, 0)
    eligible.push({ facility, score, factors })
  }

  eligible.sort((a, b) => b.score - a.score || a.facility.distanceKm - b.facility.distanceKm)
  return { eligible, excluded }
}

export function matchEvidence(caseItem: Case, match: FacilityMatch, demoNow: string): string[] {
  const facility = match.facility
  const freeCapacity = facility.bedsTotal - facility.bedsOccupied
  return [
    `Provides ${caseItem.requiredServiceLabel}`,
    'Currently accepting referrals',
    facility.status === 'available' ? 'Currently available' : 'Availability is limited',
    `Approximately ${facility.distanceKm} km from the case location`,
    freeCapacity > 0 ? 'Has available capacity' : 'No capacity available',
    isOpenAt(facility, demoNow) ? 'Currently within operating hours' : 'Outside operating hours',
    ...(caseItem.factors.referralRequired ? ['Supports the required professional referral'] : []),
  ]
}

export function lowerMatchReasons(match: FacilityMatch, recommended: FacilityMatch): string[] {
  const reasons: string[] = []
  const candidateByKey = new Map(match.factors.map((factor) => [factor.key, factor.earned]))
  const bestByKey = new Map(recommended.factors.map((factor) => [factor.key, factor.earned]))

  if ((candidateByKey.get('distance') ?? 0) < (bestByKey.get('distance') ?? 0)) {
    reasons.push(`Approximately ${match.facility.distanceKm} km away, farther than the ${recommended.facility.distanceKm} km top match`)
  }
  if ((candidateByKey.get('availability') ?? 0) < (bestByKey.get('availability') ?? 0)) {
    reasons.push(match.facility.status === 'limited' ? 'Availability is limited' : 'Availability score is lower')
  }
  if ((candidateByKey.get('capacity') ?? 0) < (bestByKey.get('capacity') ?? 0)) {
    reasons.push(`Less available capacity (${Math.max(0, match.facility.bedsTotal - match.facility.bedsOccupied)} places)`)
  }
  if ((candidateByKey.get('hours') ?? 0) < (bestByKey.get('hours') ?? 0)) {
    reasons.push('Does not provide the top match’s 24-hour operating coverage')
  }
  return reasons
}
