import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import type { AppState, Case, Facility, MatchResult, TimelineEvent } from '@/types'
import { initialAppState } from '@/data/seed'
import { computePriority } from '@/engine/priority'
import { matchFacilities } from '@/engine/matching'
import { addDays, addHours, parse } from '@/engine/time'

// ─── Actions ──────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'CREATE_CASE'; caseData: NewCaseDetails }
  | { type: 'UPDATE_ASSESSMENT'; caseId: string; caseData: NewCaseDetails }
  | { type: 'ASSESS_CASE'; caseId: string }
  | { type: 'CONFIRM_FACILITY'; caseId: string; facilityId: string }
  | { type: 'CHOOSE_ALTERNATIVE'; caseId: string; facilityId: string }
  | { type: 'SIMULATE_FACILITY_UNAVAILABLE'; caseId: string }
  | { type: 'MARK_ACCEPTED'; caseId: string }
  | { type: 'SIMULATE_FACILITY_DECLINE'; caseId: string }
  | { type: 'REQUEST_TRANSPORT'; caseId: string }
  | { type: 'ASSIGN_TRANSPORT'; caseId: string; resourceId: string }
  | { type: 'REASSIGN_TRANSPORT'; caseId: string; resourceId: string }
  | { type: 'START_TRANSPORT'; caseId: string }
  | { type: 'SIMULATE_TRANSPORT_DELAY'; caseId: string }
  | { type: 'MARK_ARRIVED'; caseId: string }
  | { type: 'SCHEDULE_FOLLOWUP'; caseId: string }
  | { type: 'COMPLETE_FOLLOWUP'; caseId: string }
  | { type: 'ADVANCE_CLOCK' }
  | { type: 'RESET_DEMO' }

export type NewCaseDetails = Omit<
  Case,
  'id' | 'receivedAt' | 'status' | 'priority' | 'selectedFacilityId' | 'referral' | 'transport' | 'followUp' | 'declinedFacilityIds'
>

export function nextCaseId(cases: Case[]): string {
  return String(Math.max(0, ...cases.map((caseItem) => Number(caseItem.id) || 0)) + 1)
}

// ─── Reducer helpers ──────────────────────────────────────────────────────────

let eventCounter = 1000
function nextEventId(): string {
  eventCounter += 1
  return `ev-${eventCounter}`
}

function evt(
  state: AppState,
  caseId: string,
  actor: TimelineEvent['actor'],
  message: string,
  kind: TimelineEvent['kind'],
): TimelineEvent {
  return { id: nextEventId(), caseId, at: state.demoNow, actor, message, kind }
}

function withEvents(state: AppState, events: TimelineEvent[]): AppState {
  return { ...state, timeline: [...events, ...state.timeline] }
}

function updateCase(state: AppState, caseId: string, fn: (c: Case) => Case): Case[] {
  return state.cases.map((c) => (c.id === caseId ? fn(c) : c))
}

function updateFacility(state: AppState, facilityId: string, fn: (f: Facility) => Facility): Facility[] {
  return state.facilities.map((f) => (f.id === facilityId ? fn(f) : f))
}

function resourceName(state: AppState, resourceId: string): string {
  return state.transportResources.find((r) => r.id === resourceId)?.name ?? resourceId
}

// ─── Reducer (guarded state machine) ─────────────────────────────────────────

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET_DEMO':
      return initialAppState()

    case 'CREATE_CASE': {
      const id = nextCaseId(state.cases)
      const caseData: Case = {
        ...action.caseData,
        id,
        receivedAt: state.demoNow,
        status: 'assessed',
        transport: { status: 'not_requested' },
        followUp: { status: 'not_scheduled' },
        declinedFacilityIds: [],
      }
      const priority = computePriority(caseData, state.facilities, state.demoNow)
      const caseItem = { ...caseData, priority }
      const recommendation = matchFacilities(caseItem, state.facilities, state.demoNow).eligible[0]
      return withEvents({ ...state, cases: [...state.cases, caseItem] }, [
        ...(recommendation ? [evt(state, id, 'System', `Facility recommendation generated: ${recommendation.facility.name} · ${recommendation.score}/100`, 'facility')] : []),
        evt(state, id, 'System', `Priority calculated: ${priority.level.toUpperCase()} · ${priority.score}`, 'assessment'),
        evt(state, id, 'System', 'Assessment completed', 'assessment'),
        evt(state, id, 'Coordinator', 'Case created', 'received'),
      ])
    }

    case 'UPDATE_ASSESSMENT': {
      const target = state.cases.find((caseItem) => caseItem.id === action.caseId)
      if (!target || !['new', 'assessed', 'facility_recommended', 'facility_unavailable', 'referral_declined'].includes(target.status)) return state
      const updated = { ...target, ...action.caseData, selectedFacilityId: undefined, referral: undefined }
      const priority = updated.status === 'new' ? undefined : computePriority(updated, state.facilities, state.demoNow)
      const cases = updateCase(state, action.caseId, (caseItem) => ({
        ...caseItem,
        ...action.caseData,
        status: caseItem.status === 'new' ? 'new' : 'assessed',
        selectedFacilityId: undefined,
        referral: undefined,
        priority,
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', 'Assessment details updated — priority and facility matches recalculated', 'assessment'),
      ])
    }

    case 'ADVANCE_CLOCK': {
      const demoNow = addDays(state.demoNow, 1)
      // Deterministic overdue refresh: scheduled follow-ups now past due become overdue.
      const cases = state.cases.map((c) =>
        c.status === 'followup_due' &&
        c.followUp.scheduledFor &&
        parse(c.followUp.scheduledFor).getTime() < parse(demoNow).getTime()
          ? { ...c, status: 'followup_overdue' as const }
          : c,
      )
      return { ...state, demoNow, cases }
    }

    case 'ASSESS_CASE': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'new') return state
      const priority = computePriority(target, state.facilities, state.demoNow)
      const cases = updateCase(state, action.caseId, (c) => ({ ...c, status: 'assessed' as const, priority }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', `Assessment complete — priority ${priority.level.toUpperCase()} (${priority.score})`, 'assessment'),
      ])
    }

    case 'CONFIRM_FACILITY': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target) return state
      const valid = ['assessed', 'facility_recommended', 'referral_declined', 'facility_unavailable'].includes(target.status)
      if (!valid) return state
      const facility = state.facilities.find((f) => f.id === action.facilityId)
      if (!facility || !matchFacilities(target, state.facilities, state.demoNow).eligible.some((match) => match.facility.id === facility.id)) return state
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'referral_pending' as const,
        selectedFacilityId: action.facilityId,
        referral: { status: 'pending' as const, createdAt: state.demoNow },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', `Facility confirmed: ${facility.name}`, 'facility'),
      ])
    }

    case 'CHOOSE_ALTERNATIVE': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || !['assessed', 'facility_recommended', 'referral_declined', 'facility_unavailable'].includes(target.status)) return state
      const facility = state.facilities.find((f) => f.id === action.facilityId)
      if (!facility || !matchFacilities(target, state.facilities, state.demoNow).eligible.some((match) => match.facility.id === facility.id)) return state
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'referral_pending' as const,
        selectedFacilityId: action.facilityId,
        referral: { status: 'pending' as const, createdAt: state.demoNow },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', `Alternative facility selected: ${facility.name}`, 'facility'),
      ])
    }

    case 'SIMULATE_FACILITY_UNAVAILABLE': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target?.selectedFacilityId) return state
      const facility = state.facilities.find((f) => f.id === target.selectedFacilityId)
      if (!facility) return state
      const facilities = updateFacility(state, facility.id, (f) => ({ ...f, status: 'unavailable' as const }))
      const cases = updateCase({ ...state, facilities }, action.caseId, (c) => ({
        ...c,
        status: 'facility_unavailable' as const,
      }))
      return withEvents({ ...state, facilities, cases }, [
        evt(state, action.caseId, 'System', `${facility.name} is no longer available`, 'alert'),
      ])
    }

    case 'MARK_ACCEPTED': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'referral_pending' || target.referral?.status !== 'pending') return state
      const facility = state.facilities.find((f) => f.id === target.selectedFacilityId)
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'referral_accepted' as const,
        referral: { status: 'accepted' as const, createdAt: c.referral?.createdAt, resolvedAt: state.demoNow },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Facility', `Referral accepted${facility ? ` — ${facility.name}` : ''}`, 'referral'),
      ])
    }

    case 'SIMULATE_FACILITY_DECLINE': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'referral_pending' || !target.selectedFacilityId) return state
      const facility = state.facilities.find((f) => f.id === target.selectedFacilityId)
      if (!facility) return state
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'referral_declined' as const,
        declinedFacilityIds: [...new Set([...c.declinedFacilityIds, facility.id])],
        referral: { status: 'declined' as const, createdAt: c.referral?.createdAt, resolvedAt: state.demoNow },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Facility', `Referral declined — ${facility.name}`, 'referral'),
      ])
    }

    case 'REQUEST_TRANSPORT': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || !['referral_accepted', 'transport_delayed'].includes(target.status)) return state
      const transportResources = state.transportResources.map((resource) =>
        resource.reservedForCaseId === action.caseId
          ? { ...resource, status: 'available' as const, reservedForCaseId: undefined, note: undefined }
          : resource,
      )
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'transport_assigned' as const,
        transport: { status: 'requested' as const, requestedAt: state.demoNow },
      }))
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'Coordinator', 'Transport requested', 'transport'),
      ])
    }

    case 'ASSIGN_TRANSPORT': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'transport_assigned' || target.transport.status !== 'requested') return state
      const resource = state.transportResources.find((r) => r.id === action.resourceId)
      if (!resource || resource.status !== 'available') return state
      const needsAssisted = target.factors.transportConstraint === 'needs_assisted_transport'
      if (needsAssisted && !resource.supportsAssisted) return state
      const transportResources = state.transportResources.map((r) =>
        r.id === action.resourceId ? { ...r, status: 'busy' as const, reservedForCaseId: action.caseId } : r,
      )
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        transport: {
          ...c.transport,
          status: 'assigned' as const,
          resourceId: resource.id,
          etaMinutes: resource.etaMinutes,
          assignedAt: state.demoNow,
        },
      }))
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'Coordinator', `${resource.name} assigned`, 'transport'),
      ])
    }

    case 'REASSIGN_TRANSPORT': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'transport_assigned' || target.transport.status !== 'assigned') return state
      const resource = state.transportResources.find((r) => r.id === action.resourceId)
      if (!resource || resource.status !== 'available') return state
      const needsAssisted = target.factors.transportConstraint === 'needs_assisted_transport'
      if (needsAssisted && !resource.supportsAssisted) return state
      const previousId = target.transport.resourceId
      const transportResources = state.transportResources.map((r) => {
        if (r.id === previousId && r.reservedForCaseId === action.caseId) {
          return { ...r, status: 'available' as const, reservedForCaseId: undefined, note: undefined }
        }
        if (r.id === resource.id) return { ...r, status: 'busy' as const, reservedForCaseId: action.caseId }
        return r
      })
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        transport: { ...c.transport, resourceId: resource.id, etaMinutes: resource.etaMinutes, assignedAt: state.demoNow },
      }))
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'Coordinator', `Transport changed to ${resource.name}`, 'transport'),
      ])
    }

    case 'START_TRANSPORT': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'transport_assigned' || target.transport.status !== 'assigned') return state
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'in_transit' as const,
        transport: { ...c.transport, status: 'en_route' as const, startedAt: state.demoNow },
      }))
      const transportResources = state.transportResources.map((r) =>
        r.id === target.transport.resourceId
          ? { ...r, assignedCaseId: action.caseId, note: `En route with case #${action.caseId}` }
          : r,
      )
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'Transport', `${target.transport.resourceId ? resourceName(state, target.transport.resourceId) : 'Transport'} en route`, 'transport'),
      ])
    }

    case 'SIMULATE_TRANSPORT_DELAY': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || !['referral_accepted', 'transport_assigned'].includes(target.status)) return state
      const transportResources = state.transportResources.map((resource) =>
        resource.reservedForCaseId === action.caseId
          ? { ...resource, status: 'available' as const, reservedForCaseId: undefined, note: undefined }
          : resource,
      )
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'transport_delayed' as const,
        transport: {
          status: 'delayed' as const,
          note: 'No currently available assisted-transport resource matches this case.',
        },
      }))
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'System', 'Transport unavailable — coordination blocked', 'alert'),
      ])
    }

    case 'MARK_ARRIVED': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'in_transit') return state
      const facilityName = state.facilities.find((f) => f.id === target.selectedFacilityId)?.name
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'arrived' as const,
        transport: { ...c.transport, status: 'arrived' as const, arrivedAt: state.demoNow },
      }))
      const transportResources = state.transportResources.map((r) =>
        r.id === target.transport.resourceId
          ? { ...r, status: 'available' as const, assignedCaseId: undefined, reservedForCaseId: undefined, note: undefined }
          : r,
      )
      return withEvents({ ...state, transportResources, cases }, [
        evt(state, action.caseId, 'Transport', `Patient arrived at ${facilityName ?? 'facility'}`, 'arrival'),
      ])
    }

    case 'SCHEDULE_FOLLOWUP': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || target.status !== 'arrived') return state
      const dueAt =
        target.factors.followUpUrgency === 'within_24h'
          ? addHours(state.demoNow, 24)
          : target.factors.followUpUrgency === 'within_week'
            ? addDays(state.demoNow, 7)
            : addDays(state.demoNow, 3)
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'followup_due' as const,
        followUp: { status: 'scheduled' as const, scheduledFor: dueAt },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', 'Follow-up scheduled', 'followup'),
      ])
    }

    case 'COMPLETE_FOLLOWUP': {
      const target = state.cases.find((c) => c.id === action.caseId)
      if (!target || !['followup_due', 'followup_overdue'].includes(target.status)) return state
      const cases = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'followup_completed' as const,
        followUp: { ...c.followUp, status: 'completed' as const, completedAt: state.demoNow },
      }))
      return withEvents({ ...state, cases }, [
        evt(state, action.caseId, 'Coordinator', 'Follow-up completed — referral journey finished', 'complete'),
      ])
    }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface StoreContextValue {
  state: AppState
  dispatch: Dispatch<Action>
  matches: (caseId: string) => MatchResult
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialAppState)

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      matches: (caseId: string) => {
        const c = state.cases.find((x) => x.id === caseId)
        if (!c) return { eligible: [], excluded: [] }
        return matchFacilities(c, state.facilities, state.demoNow)
      },
    }),
    [state],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
