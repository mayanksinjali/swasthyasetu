import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  MapPin,
} from 'lucide-react'
import { useStore } from '@/state/store'
import type { Case } from '@/types'
import { PriorityBadge, ReferralBadge, StatusBadge, TransportBadge, FollowUpBadge } from '@/components/badges'
import { WorkflowStepper } from '@/components/WorkflowStepper'
import { Timeline } from '@/components/Timeline'
import { FactorBar } from '@/components/FactorBar'
import { DemoControls } from '@/components/DemoControls'
import { nextActionFor } from '@/engine/workflow'
import { PRIORITY_RULES } from '@/engine/priority'
import { clockTime, dueLabel, relativeTime } from '@/engine/time'
import { CaseIntakeForm } from '@/components/CaseIntakeForm'
import { matchEvidence, lowerMatchReasons } from '@/engine/matching'

export function CaseWorkspace() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const [editingAssessment, setEditingAssessment] = useState(false)
  const reduced = useReducedMotion()
  const c = state.cases.find((x) => x.id === caseId)
  const caseEvents = useMemo(
    () => c ? state.timeline.filter((e) => e.caseId === c.id).sort((a, b) => b.at.localeCompare(a.at)) : [],
    [state.timeline, c?.id],
  )

  if (!c) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center shadow-card">
        <p className="text-sm text-ink-2">Case not found.</p>
        <button onClick={() => navigate('/cases')} className="mt-3 text-sm font-medium text-teal-700 hover:underline">
          ← Back to Cases
        </button>
      </div>
    )
  }

  const action = nextActionFor(c)
  const assessmentEditable = ['new', 'assessed', 'facility_recommended', 'facility_unavailable', 'referral_declined'].includes(c.status)

  return (
    <motion.div
      key={c.id}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-teal-700"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span className="tabular text-xs text-muted">Opened {relativeTime(c.receivedAt, state.demoNow)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="tabular font-display text-[26px] font-bold tracking-tight text-ink">Case #{c.id}</h1>
          {c.priority && <PriorityBadge level={c.priority.level} score={c.priority.score} size="lg" />}
          <StatusBadge status={c.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {c.location}</span>
          <span>{c.categoryLabel}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Received {clockTime(c.receivedAt)}</span>
        </div>
      </header>

      {/* Stepper */}
      <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
        <WorkflowStepper status={c.status} />
      </div>

      {assessmentEditable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-xs text-ink-2">Change assessment inputs to recalculate priority and facility matches.</p>
          <button onClick={() => setEditingAssessment((open) => !open)} className="rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50">
            {editingAssessment ? 'Close assessment editor' : 'Edit assessment'}
          </button>
        </div>
      )}

      {editingAssessment && assessmentEditable && (
        <CaseIntakeForm
          key={`edit-${c.id}`}
          initialCase={c}
          onClose={() => setEditingAssessment(false)}
          onUpdate={(caseData) => {
            dispatch({ type: 'UPDATE_ASSESSMENT', caseId: c.id, caseData })
            setEditingAssessment(false)
          }}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left column: priority + summary */}
        <div className="space-y-5 lg:col-span-2">
          {c.priority && <PriorityCard caseItem={c} />}
          <SummaryCard caseItem={c} />
        </div>

        {/* Right column: workflow */}
        <div className="space-y-5 lg:col-span-3">
          {/* NEXT ACTION — most prominent */}
          {action.type !== 'none' && (
            <motion.section
              aria-label="Recommended next action"
              layout={!reduced}
              className="overflow-hidden rounded-2xl bg-teal-800 text-white shadow-raised"
            >
              <div className="px-5 pb-5 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200">
                  Recommended next action
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={action.type + action.label}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">{action.label}</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-teal-100/90">{action.description}</p>
                    <ActionButton caseItem={c} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.section>
          )}
          {action.type === 'none' && (
            <motion.section
              layout={!reduced}
              className="flex items-center gap-3 rounded-2xl bg-success-bg px-5 py-4 ring-1 ring-inset ring-success/25"
            >
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <p className="text-sm font-semibold text-success">Referral journey complete</p>
                <p className="text-xs text-ink-2">All coordination steps finished. Metrics and pipeline updated.</p>
              </div>
            </motion.section>
          )}

          {/* Facility recommendation / confirmed referral */}
          <FacilityCard caseItem={c} />

          {/* Referral card */}
          <ReferralCard caseItem={c} />

          {/* Transport card */}
          <TransportCard caseItem={c} />

          {/* Follow-up card */}
          <FollowUpCard caseItem={c} />

          <DemoControls caseItem={c} />
        </div>

        {/* Timeline — right rail on xl, below on smaller */}
        <aside className="lg:col-span-5 xl:col-span-5" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section aria-label="Case timeline" className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-5 xl:col-span-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Case Timeline</h2>
          <div className="mt-4">
            <Timeline events={caseEvents} />
          </div>
        </section>
      </div>
    </motion.div>
  )
}

// ─── Action button under next-action card ─────────────────────────────────────

function ActionButton({ caseItem: c }: { caseItem: Case }) {
  const { dispatch, matches } = useStore()
  const navigate = useNavigate()
  const action = nextActionFor(c)
  const top = matches(c.id).eligible[0]

  const run = () => {
    switch (action.type) {
      case 'run_assessment':
        dispatch({ type: 'ASSESS_CASE', caseId: c.id })
        break
      case 'confirm_facility':
      case 'choose_alternative':
        if (top) dispatch({ type: 'CONFIRM_FACILITY', caseId: c.id, facilityId: top.facility.id })
        break
      case 'mark_accepted':
        dispatch({ type: 'MARK_ACCEPTED', caseId: c.id })
        break
      case 'request_transport':
        dispatch({ type: 'REQUEST_TRANSPORT', caseId: c.id })
        break
      case 'assign_transport': {
        const res = useStoreResources(c)
        if (res) dispatch({ type: 'ASSIGN_TRANSPORT', caseId: c.id, resourceId: res })
        break
      }
      case 'start_transport':
        dispatch({ type: 'START_TRANSPORT', caseId: c.id })
        break
      case 'mark_arrived':
        dispatch({ type: 'MARK_ARRIVED', caseId: c.id })
        break
      case 'schedule_followup':
        dispatch({ type: 'SCHEDULE_FOLLOWUP', caseId: c.id })
        break
      case 'complete_followup':
        dispatch({ type: 'COMPLETE_FOLLOWUP', caseId: c.id })
        break
      default:
        break
    }
    if (action.type === 'run_assessment') navigate(`/cases/${c.id}`)
  }

  if (action.type === 'assign_transport') {
    return null // transport selection handled in TransportCard
  }

  return (
    <button
      onClick={run}
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-card transition-transform hover:scale-[1.02] active:scale-[0.99]"
    >
      {action.label}
    </button>
  )
}

// Deterministic pick: best available assisted-capable resource, else any available.
function useStoreResources(c: Case): string | undefined {
  const { state } = useStore()
  const needsAssisted = c.factors.transportConstraint === 'needs_assisted_transport'
  const pool = state.transportResources.filter((r) => r.status === 'available' && (!needsAssisted || r.supportsAssisted))
  pool.sort((a, b) => (a.etaMinutes ?? 99) - (b.etaMinutes ?? 99))
  return pool[0]?.id
}

// ─── Priority card ────────────────────────────────────────────────────────────

function PriorityCard({ caseItem: c }: { caseItem: Case }) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const p = c.priority
  if (!p) return null
  return (
    <section aria-label="Priority assessment" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{c.status === 'new' ? 'Live Priority Preview' : 'Assessment Complete'}</h2>
          <div className="mt-2 flex items-baseline gap-2.5">
            <PriorityBadge level={p.level} size="lg" />
            <motion.span
              key={p.score}
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`tabular font-display text-4xl font-bold tracking-tight ${
                p.level === 'urgent' ? 'text-urgent' : p.level === 'priority' ? 'text-priority' : 'text-ink'
              }`}
            >
              {p.score}
            </motion.span>
            <span className="text-xs text-muted">/ 100</span>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
        {p.reasons.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-ink-2">{r.label}</span>
            <span className="tabular shrink-0 font-semibold text-ink">+{r.points}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
        aria-expanded={open}
      >
        How is this calculated?
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 rounded-xl bg-surface-2 p-3.5 ring-1 ring-inset ring-line">
              {PRIORITY_RULES.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{group.group}</p>
                  <ul className="mt-1 space-y-0.5">
                    {group.rows.map((row) => (
                      <li key={row.key} className="flex justify-between text-xs">
                        <span className="text-ink-2">{row.label}</span>
                        <span className="tabular font-medium text-ink-2">+{row.points}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <Info size={12} /> Demo coordination rules — not clinical advice.
      </p>
    </section>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ caseItem: c }: { caseItem: Case }) {
  return (
    <section aria-label="Case summary" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Case Summary</h2>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 font-display text-sm font-bold text-teal-700 ring-1 ring-inset ring-teal-200">
          {c.patientAlias.split(' ').slice(-1)[0]?.replace('.', '')}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{c.patientAlias}</p>
          <p className="text-xs text-muted">Age band {c.ageBand} · {c.location}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{c.summary}</p>
      <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
        {[
          ['Required service', c.requiredServiceLabel],
          ['Reported by', c.context.reportedBy],
          ['Mobility', c.context.mobility],
          ['Time-sensitivity', c.context.timeSensitivity],
          ['Caregiver available', c.context.caregiverAvailable],
          ['Administrative status', c.context.administrativeStatus],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className="text-right font-medium text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-muted">Administrative information only; no clinical data.</p>
    </section>
  )
}

// ─── Facility card ────────────────────────────────────────────────────────────

function FacilityCard({ caseItem: c }: { caseItem: Case }) {
  const { state, dispatch, matches } = useStore()
  const reduced = useReducedMotion()
  const [showExcluded, setShowExcluded] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const match = matches(c.id)
  const top = match.eligible[0]
  const confirmed = c.selectedFacilityId
    ? state.facilities.find((f) => f.id === c.selectedFacilityId)
    : undefined
  const recommendationMode =
    ['assessed', 'facility_recommended', 'referral_declined', 'facility_unavailable'].includes(c.status)

  if (!recommendationMode && !confirmed) return null

  return (
    <section aria-label="Facility" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      {recommendationMode ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Recommended Facility</h2>
            <div className="flex items-center gap-3">
              {top && <button onClick={() => setShowWhy((open) => !open)} aria-expanded={showWhy} className="text-[11px] font-semibold text-teal-700 hover:underline">Why this?</button>}
              <span className="text-[11px] text-muted">{match.eligible.length} eligible · {match.excluded.length} excluded</span>
            </div>
          </div>
          {top && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-ink-2">
              <span className="font-semibold uppercase tracking-wider text-muted">Your assessment</span>
              <span>{c.categoryLabel}</span><span className="text-muted">→</span>
              <span>{c.requiredServiceLabel}</span><span className="text-muted">→</span>
              <span>{c.context.timeSensitivity}</span><span className="text-muted">→</span>
              <span>{c.factors.transportConstraint === 'needs_assisted_transport' ? 'Assisted transport' : c.factors.transportConstraint === 'remote_location' ? 'Remote location' : 'No transport constraint'}</span>
            </div>
          )}
          {top ? (
            <motion.div
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-3 rounded-xl bg-teal-50 p-4 ring-1 ring-inset ring-teal-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-bold text-ink">{top.facility.name}</p>
                    <p className="text-xs text-muted">{top.facility.location} · ~{top.facility.distanceKm} km</p>
                  </div>
                </div>
                <motion.div
                  key={top.score}
                  initial={reduced ? false : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-right"
                >
                  <span className="tabular font-display text-3xl font-bold text-teal-700">{top.score}</span>
                  <span className="text-xs font-medium text-muted"> / 100</span>
                </motion.div>
              </div>
              <div className="mt-4 space-y-2.5">
                {top.factors.map((f, i) => (
                  <FactorBar key={f.key} label={f.label} earned={f.earned} max={f.max} index={i} highlight={f.earned === f.max} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-teal-200 pt-3 text-xs font-semibold text-teal-900">
                <span>Match score</span><span className="tabular">{top.score} / 100</span>
              </div>
            </motion.div>
          ) : (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-urgent-bg px-4 py-3 text-sm text-urgent ring-1 ring-inset ring-urgent/20">
              <AlertTriangle size={15} /> No eligible facility is currently available for this case.
            </p>
          )}

          <AnimatePresence initial={false}>
            {showWhy && top && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl border border-teal-200 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-700">Why {top.facility.name}?</p>
                  <p className="mt-1 text-xs text-ink-2">Your assessment requested <strong>{c.requiredServiceLabel}</strong>. This eligible facility earned the highest score for this case:</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {matchEvidence(c, top, state.demoNow).map((reason) => (
                      <li key={reason} className="flex items-start gap-2 text-xs text-ink-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-700" />{reason}</li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-line pt-3 text-xs font-semibold text-ink">Highest eligible match score: <span className="tabular text-teal-700">{top.score} / 100</span></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alternatives */}
          {match.eligible.length > 1 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Other eligible facilities</p>
              <ul className="mt-1.5 space-y-2">
                {match.eligible.slice(1).map((m) => (
                  <li key={m.facility.id} className="rounded-lg border border-line px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{m.facility.name}</span>
                      <span className="tabular text-[13px] font-bold text-ink-2">{m.score}<span className="text-[10px] font-normal text-muted"> / 100</span></span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">~{m.facility.distanceKm} km · {m.facility.status === 'available' ? 'Available' : 'Limited availability'} · {m.facility.bedsTotal - m.facility.bedsOccupied} capacity available · {m.facility.alwaysOpen ? '24-hour service' : 'Scheduled hours'}</p>
                    {lowerMatchReasons(m, top).length > 0 && <p className="mt-1.5 text-[11px] text-ink-2"><span className="font-semibold">Why lower?</span> {lowerMatchReasons(m, top).join(' · ')}</p>}
                    <button onClick={() => dispatch({ type: 'CHOOSE_ALTERNATIVE', caseId: c.id, facilityId: m.facility.id })} className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline">Choose this facility</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Excluded */}
          {match.excluded.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowExcluded((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink-2"
                aria-expanded={showExcluded}
              >
                Not eligible ({match.excluded.length})
                <ChevronDown size={13} className={`transition-transform duration-200 ${showExcluded ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {showExcluded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 space-y-1 overflow-hidden"
                  >
                    {match.excluded.map((e) => (
                      <li key={e.facility.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
                        <span className="text-xs text-muted line-through decoration-line-strong">{e.facility.name}</span>
                        <span className="text-[11px] font-medium text-urgent">{e.reason}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {c.status === 'facility_unavailable' && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-urgent-bg px-3 py-2 text-xs text-urgent">
              <AlertTriangle size={13} />
              {confirmed?.name ?? 'The selected facility'} is no longer available. Choose the next eligible facility.
            </p>
          )}
          {c.status === 'referral_declined' && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-urgent-bg px-3 py-2 text-xs text-urgent">
              <AlertTriangle size={13} />
              The facility declined this referral. It has been excluded from matching — confirm the next option.
            </p>
          )}
        </>
      ) : (
        /* Confirmed-referral mode */
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Building2 size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Confirmed Facility</p>
              <p className="font-display text-[15px] font-bold text-ink">{confirmed?.name}</p>
            </div>
          </div>
          {confirmed && <StatusBadge status={c.status} />}
        </div>
      )}
    </section>
  )
}

// ─── Referral card ────────────────────────────────────────────────────────────

function ReferralCard({ caseItem: c }: { caseItem: Case }) {
  const { state, dispatch } = useStore()
  const facility = c.selectedFacilityId ? state.facilities.find((f) => f.id === c.selectedFacilityId) : undefined
  if (!c.referral || !facility) return null
  return (
    <section aria-label="Referral" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Referral</h2>
        <ReferralBadge status={c.referral.status} />
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{facility.name}</p>
      <p className="text-xs text-muted">
        {c.referral.createdAt ? `Created ${clockTime(c.referral.createdAt)}` : ''}
        {c.referral.resolvedAt ? ` · Resolved ${clockTime(c.referral.resolvedAt)}` : ''}
      </p>
      {c.referral.status === 'pending' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => dispatch({ type: 'MARK_ACCEPTED', caseId: c.id })}
            className="rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Mark Referral Accepted
          </button>
          <button
            onClick={() => dispatch({ type: 'SIMULATE_FACILITY_DECLINE', caseId: c.id })}
            className="rounded-lg bg-surface px-3.5 py-2 text-[13px] font-medium text-urgent ring-1 ring-inset ring-urgent/30 transition-colors hover:bg-urgent-bg"
          >
            Simulate Facility Decline
          </button>
          <span className="self-center text-[11px] text-muted">demo action</span>
        </div>
      )}
    </section>
  )
}

// ─── Transport card ───────────────────────────────────────────────────────────

function TransportCard({ caseItem: c }: { caseItem: Case }) {
  const { state, dispatch } = useStore()
  const reduced = useReducedMotion()
  const show =
    ['referral_accepted', 'transport_assigned', 'in_transit', 'transport_delayed', 'arrived'].includes(c.status) ||
    c.transport.status !== 'not_requested'
  if (!show) return null

  const resource = c.transport.resourceId ? state.transportResources.find((r) => r.id === c.transport.resourceId) : undefined
  const needsAssisted = c.factors.transportConstraint === 'needs_assisted_transport'
  const availablePool = state.transportResources.filter(
    (r) => r.status === 'available' && (!needsAssisted || r.supportsAssisted),
  )
  const noMatch = c.status === 'transport_delayed'

  return (
    <section aria-label="Transport" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Transport</h2>
        <TransportBadge status={c.transport.status} />
      </div>

      {noMatch && (
        <div className="mt-3 rounded-xl bg-urgent-bg p-3.5 ring-1 ring-inset ring-urgent/20">
          <p className="flex items-center gap-2 text-sm font-semibold text-urgent">
            <AlertTriangle size={15} /> Transport unavailable
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">
            No currently available assisted-transport resource matches this case. Retry, or release a busy resource.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={() => dispatch({ type: 'REQUEST_TRANSPORT', caseId: c.id })}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Retry Transport
            </button>
          </div>
        </div>
      )}

      {(c.transport.status === 'assigned' || c.transport.status === 'en_route' || c.transport.status === 'arrived') && resource && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-teal-50 p-3.5 ring-1 ring-inset ring-teal-200">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Ambulance size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{resource.name}</p>
            <p className="text-xs text-muted">
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} · assisted transport supported
              {c.transport.etaMinutes !== undefined ? ` · ETA ${c.transport.etaMinutes} min` : ''}
            </p>
          </div>
          <motion.span
            key={c.transport.status}
            initial={reduced ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200"
          >
            {c.transport.status === 'assigned' ? 'Ready' : c.transport.status === 'en_route' ? 'En route' : 'Arrived'}
          </motion.span>
        </div>
      )}

      {c.status === 'transport_assigned' && c.transport.status === 'assigned' && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium text-ink-2">Change assigned resource before departure</p>
          <div className="flex flex-wrap gap-2">
            {availablePool.filter((candidate) => candidate.id !== resource?.id).map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => dispatch({ type: 'REASSIGN_TRANSPORT', caseId: c.id, resourceId: candidate.id })}
                className="rounded-lg border border-line bg-white px-3 py-2 text-left text-xs transition-colors hover:border-teal-400 hover:bg-teal-50"
              >
                <span className="block font-semibold text-ink">Switch to {candidate.name}</span>
                <span className="mt-0.5 block text-muted">ETA {candidate.etaMinutes ?? '—'} min · {candidate.supportsAssisted ? 'assisted support' : 'standard'}</span>
              </button>
            ))}
            {availablePool.filter((candidate) => candidate.id !== resource?.id).length === 0 && (
              <p className="text-xs text-muted">No other eligible resources are available right now.</p>
            )}
          </div>
        </div>
      )}

      {c.transport.status === 'requested' && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted">
            Select an available resource{needsAssisted ? ' supporting assisted transport' : ''}:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {state.transportResources
                .filter((r) => r.status === 'available' && (!needsAssisted || r.supportsAssisted))
                .map((r) => (
                  <motion.button
                    key={r.id}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22 }}
                    onClick={() => dispatch({ type: 'ASSIGN_TRANSPORT', caseId: c.id, resourceId: r.id })}
                    className="rounded-xl border border-line bg-surface p-3 text-left ring-offset-2 transition-all hover:border-teal-400 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{r.name}</span>
                      <span className="tabular rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-700 ring-1 ring-inset ring-teal-200">
                        {r.etaMinutes !== undefined ? `ETA ${r.etaMinutes}m` : '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {r.type.charAt(0).toUpperCase() + r.type.slice(1)} · {r.supportsAssisted ? 'assisted transport' : 'no assisted support'}
                    </p>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
          {availablePool.length === 0 && (
            <p className="mt-2 text-xs text-urgent">No available resource matches this case right now.</p>
          )}
        </div>
      )}

      {c.status === 'referral_accepted' && c.transport.status === 'not_requested' && (
        <p className="mt-3 text-xs text-muted">Referral accepted — request transport to continue.</p>
      )}
    </section>
  )
}

// ─── Follow-up card ───────────────────────────────────────────────────────────

function FollowUpCard({ caseItem: c }: { caseItem: Case }) {
  const { dispatch, state } = useStore()
  const reduced = useReducedMotion()
  const show = ['arrived', 'followup_due', 'followup_overdue', 'followup_completed'].includes(c.status)
  if (!show) return null

  const overdue = c.status === 'followup_overdue'
  const due = c.followUp.scheduledFor ? dueLabel(c.followUp.scheduledFor, state.demoNow) : undefined

  return (
    <section aria-label="Follow-up" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Follow-up</h2>
        <FollowUpBadge status={c.followUp.status} />
      </div>

      {c.status === 'arrived' && (
        <p className="mt-2 text-sm text-ink-2">
          Patient arrived. {c.factors.followUpUrgency === 'within_24h' ? 'Follow-up needed within 24 hours.' : 'Schedule the follow-up visit.'}
        </p>
      )}

      {(c.status === 'followup_due' || c.status === 'followup_overdue') && (
        <motion.div
          initial={reduced ? false : { scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-3 rounded-xl p-3.5 ring-1 ring-inset ${
            overdue ? 'bg-urgent-bg ring-urgent/25' : 'bg-priority-bg ring-priority/20'
          }`}
        >
          <p className={`text-sm font-bold uppercase tracking-wide ${overdue ? 'text-urgent' : 'text-priority'}`}>
            {overdue ? 'Follow-up overdue' : 'Follow-up due'}
          </p>
          {due && <p className={`mt-0.5 text-xs ${overdue ? 'text-urgent' : 'text-priority'}`}>{due}</p>}
        </motion.div>
      )}

      {c.status === 'followup_completed' && (
        <motion.div
          initial={reduced ? false : { scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-3 flex items-center gap-2.5 rounded-xl bg-success-bg p-3.5 ring-1 ring-inset ring-success/25"
        >
          <CheckCircle2 size={18} className="text-success" />
          <p className="text-sm font-medium text-success">Follow-up completed — journey finished.</p>
        </motion.div>
      )}

      {c.status === 'followup_due' && (
        <button
          onClick={() => dispatch({ type: 'COMPLETE_FOLLOWUP', caseId: c.id })}
          className="mt-3 rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700"
        >
          Mark Follow-up Complete
        </button>
      )}
      {c.status === 'followup_overdue' && (
        <button
          onClick={() => dispatch({ type: 'COMPLETE_FOLLOWUP', caseId: c.id })}
          className="mt-3 rounded-lg bg-urgent px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-110"
        >
          Mark Follow-up Complete
        </button>
      )}
    </section>
  )
}

