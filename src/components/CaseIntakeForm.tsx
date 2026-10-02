import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Case, FollowUpUrgency, ReferralCategory, ServiceKey, TimeSensitivity, TransportConstraint } from '@/types'
import type { NewCaseDetails } from '@/state/store'
import { SERVICE_LABELS } from '@/engine/workflow'
import { computePriority } from '@/engine/priority'
import { matchFacilities } from '@/engine/matching'
import { lowerMatchReasons, matchEvidence } from '@/engine/matching'
import { nextCaseId, useStore } from '@/state/store'
import { FactorBar } from '@/components/FactorBar'

const CATEGORY_OPTIONS: { value: ReferralCategory; label: string; service: ServiceKey }[] = [
  { value: 'maternal_care', label: 'Maternal Care', service: 'maternity' },
  { value: 'imaging', label: 'Imaging', service: 'imaging' },
  { value: 'specialist', label: 'Specialist', service: 'specialist' },
  { value: 'chronic_review', label: 'Chronic Review', service: 'chronic' },
  { value: 'pediatric', label: 'Pediatric', service: 'pediatric' },
  { value: 'general', label: 'General Care', service: 'basic' },
]

const fieldClass = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100'
const labelClass = 'mb-1 block text-xs font-semibold text-ink-2'

function toDetails(caseItem?: Case): NewCaseDetails {
  if (caseItem) {
    const { patientAlias, ageBand, location, category, categoryLabel, requiredService, requiredServiceLabel, summary, context, factors } = caseItem
    return { patientAlias, ageBand, location, category, categoryLabel, requiredService, requiredServiceLabel, summary, context, factors }
  }
  return {
    patientAlias: '',
    ageBand: '25–34',
    location: '',
    category: 'maternal_care',
    categoryLabel: 'Maternal Care',
    requiredService: 'maternity',
    requiredServiceLabel: SERVICE_LABELS.maternity,
    summary: '',
    context: {
      reportedBy: 'Community Health Worker',
      mobility: 'Walks unassisted',
      timeSensitivity: 'Within 48 hours',
      caregiverAvailable: 'Unknown',
      administrativeStatus: 'Referral coordination required',
    },
    factors: {
      timeSensitivity: 'within_48h',
      referralRequired: true,
      specializedServiceNeeded: false,
      transportConstraint: 'none',
      followUpUrgency: 'routine',
    },
  }
}

function sensitivityLabel(value: TimeSensitivity): string {
  return value === 'same_day' ? 'Same-day' : value === 'within_48h' ? 'Within 48 hours' : 'Flexible this week'
}

export function CaseIntakeForm({
  onClose,
  onCreate,
  onUpdate,
  initialCase,
  workflow = false,
}: {
  onClose: () => void
  onCreate?: (caseData: NewCaseDetails) => void
  onUpdate?: (caseData: NewCaseDetails) => void
  initialCase?: Case
  workflow?: boolean
}) {
  const { state } = useStore()
  const [draft, setDraft] = useState(() => toDetails(initialCase))
  const [step, setStep] = useState(0)
  const [createdCaseId, setCreatedCaseId] = useState('')
  const [municipality, setMunicipality] = useState(() => initialCase?.location.split(',')[0]?.trim() ?? '')
  const [ward, setWard] = useState(() => initialCase?.location.split(',').slice(1).join(',').trim() ?? '')
  const editing = Boolean(initialCase)
  const previewCase: Case = {
    ...draft,
    id: initialCase?.id ?? 'preview',
    receivedAt: initialCase?.receivedAt ?? state.demoNow,
    status: 'new',
    transport: initialCase?.transport ?? { status: 'not_requested' },
    followUp: initialCase?.followUp ?? { status: 'not_scheduled' },
    declinedFacilityIds: initialCase?.declinedFacilityIds ?? [],
  }
  const matches = matchFacilities(previewCase, state.facilities, state.demoNow)
  const priority = computePriority(previewCase, state.facilities, state.demoNow)
  const recommended = matches.eligible[0]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (workflow) {
      if (step < 3) {
        if (step === 2 && !recommended) return
        setStep((current) => current + 1)
        return
      }
      const id = nextCaseId(state.cases)
      onCreate?.(draft)
      setCreatedCaseId(id)
      setStep(4)
      return
    }
    if (editing) onUpdate?.(draft)
    else onCreate?.(draft)
  }

  function updatePlace(nextMunicipality: string, nextWard: string) {
    const location = [nextMunicipality.trim(), nextWard.trim()].filter(Boolean).join(', ')
    setDraft((current) => ({ ...current, location }))
  }

  function updateContext<K extends keyof NewCaseDetails['context']>(key: K, value: NewCaseDetails['context'][K]) {
    setDraft((current) => ({ ...current, context: { ...current.context, [key]: value } }))
  }

  function updateFactor<K extends keyof NewCaseDetails['factors']>(key: K, value: NewCaseDetails['factors'][K]) {
    setDraft((current) => ({ ...current, factors: { ...current.factors, [key]: value } }))
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-200 bg-surface shadow-raised" aria-label={editing ? 'Edit case assessment' : 'Add a case'}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">{editing ? `Case #${initialCase?.id} · assessment` : 'New referral intake'}</p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink">{editing ? 'Update assessment' : workflow && step === 4 ? 'Case created' : workflow ? ['Case information', 'Assessment', 'Facility match', 'Review'][step] : 'Add a case'}</h2>
          <p className="mt-0.5 text-xs text-muted">Administrative coordination details only. Do not enter diagnoses or symptoms.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close form" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink">
          <X size={17} />
        </button>
      </div>

      {workflow && step < 4 && (
        <ol className="grid grid-cols-4 border-b border-line bg-surface-2/60 px-5 py-3" aria-label="New case progress">
          {['Information', 'Assessment', 'Facility match', 'Review'].map((label, index) => (
            <li key={label} className={`flex items-center gap-2 text-[10px] font-semibold sm:text-xs ${index <= step ? 'text-teal-800' : 'text-muted'}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] ${index < step ? 'bg-teal-700 text-white' : index === step ? 'bg-white text-teal-800 ring-1 ring-teal-500' : 'bg-surface text-muted ring-1 ring-line'}`}>{index < step ? <Check size={12} /> : `0${index + 1}`}</span>
              <span className="hidden sm:inline">{label}</span>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={submit} className={`grid gap-5 p-5 ${workflow && step === 4 ? 'grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_280px]'}`}>
        <div className="space-y-5">
          {(!workflow || step === 0) && (
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Case details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={labelClass}>Patient alias</span><input required value={draft.patientAlias} onChange={(event) => setDraft({ ...draft, patientAlias: event.target.value })} placeholder="Demo Patient A.B." className={fieldClass} /></label>
              <label><span className={labelClass}>Age band</span><select value={draft.ageBand} onChange={(event) => setDraft({ ...draft, ageBand: event.target.value })} className={fieldClass}>{['0–4', '5–12', '13–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+'].map((age) => <option key={age}>{age}</option>)}</select></label>
              <label><span className={labelClass}>Municipality</span><input required value={municipality} onChange={(event) => { setMunicipality(event.target.value); updatePlace(event.target.value, ward) }} placeholder="Butwal" className={fieldClass} /></label>
              <label><span className={labelClass}>Ward</span><input value={ward} onChange={(event) => { setWard(event.target.value); updatePlace(municipality, event.target.value) }} placeholder="Ward 11" className={fieldClass} /></label>
              <label><span className={labelClass}>Reported by</span><select value={draft.context.reportedBy} onChange={(event) => updateContext('reportedBy', event.target.value)} className={fieldClass}><option>Community Health Worker</option><option>Community Health Volunteer</option><option>Family Member</option><option>Coordinator</option></select></label>
              <label><span className={labelClass}>Care category</span><select value={draft.category} onChange={(event) => { const option = CATEGORY_OPTIONS.find((item) => item.value === event.target.value)!; setDraft((current) => ({ ...current, category: option.value, categoryLabel: option.label, requiredService: option.service, requiredServiceLabel: SERVICE_LABELS[option.service] })) }} className={fieldClass}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label><span className={labelClass}>Required service</span><select value={draft.requiredService} onChange={(event) => { const service = event.target.value as ServiceKey; const category = CATEGORY_OPTIONS.find((option) => option.service === service); setDraft((current) => ({ ...current, requiredService: service, requiredServiceLabel: SERVICE_LABELS[service], ...(category ? { category: category.value, categoryLabel: category.label } : {}) })) }} className={fieldClass}>{Object.entries(SERVICE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <label className="sm:col-span-2"><span className={labelClass}>Administrative summary</span><textarea required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} rows={2} maxLength={240} placeholder="Describe the referral coordination need, not medical details." className={fieldClass} /></label>
            </div>
          </section>
          )}

          {(!workflow || step === 1) && <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Coordination assessment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className={labelClass}>Time sensitivity</span><select value={draft.factors.timeSensitivity} onChange={(event) => { const value = event.target.value as TimeSensitivity; updateFactor('timeSensitivity', value); updateContext('timeSensitivity', sensitivityLabel(value)) }} className={fieldClass}><option value="same_day">Same day</option><option value="within_48h">Within 48 hours</option><option value="flexible">Flexible</option></select></label>
              <label><span className={labelClass}>Transport requirement</span><select value={draft.factors.transportConstraint} onChange={(event) => { const value = event.target.value as TransportConstraint; updateFactor('transportConstraint', value); updateContext('mobility', value === 'needs_assisted_transport' ? 'Needs assisted transport' : value === 'remote_location' ? 'Remote location' : 'Walks unassisted') }} className={fieldClass}><option value="none">No special requirement</option><option value="needs_assisted_transport">Assisted transport required</option><option value="remote_location">Remote location</option></select></label>
              <label><span className={labelClass}>Mobility context</span><select value={draft.context.mobility} onChange={(event) => updateContext('mobility', event.target.value)} className={fieldClass}><option>Walks unassisted</option><option>Accompanied by caregiver</option><option>Needs assisted transport</option><option>Wheelchair — assisted transport</option></select></label>
              <label><span className={labelClass}>Caregiver available</span><select value={draft.context.caregiverAvailable} onChange={(event) => updateContext('caregiverAvailable', event.target.value)} className={fieldClass}><option>Yes</option><option>No</option><option>Unknown</option></select></label>
              <label><span className={labelClass}>Follow-up urgency</span><select value={draft.factors.followUpUrgency} onChange={(event) => updateFactor('followUpUrgency', event.target.value as FollowUpUrgency)} className={fieldClass}><option value="within_24h">Within 24 hours</option><option value="within_week">Within a week</option><option value="routine">Routine</option></select></label>
              <label><span className={labelClass}>Administrative status</span><input required value={draft.context.administrativeStatus} onChange={(event) => updateContext('administrativeStatus', event.target.value)} className={fieldClass} /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-2"><input type="checkbox" checked={draft.factors.referralRequired} onChange={(event) => updateFactor('referralRequired', event.target.checked)} className="accent-teal-700" /> Referral required</label>
              <label className="flex items-center gap-2 text-xs font-medium text-ink-2"><input type="checkbox" checked={draft.factors.specializedServiceNeeded} onChange={(event) => updateFactor('specializedServiceNeeded', event.target.checked)} className="accent-teal-700" /> Specialized service required</label>
            </div>
          </section>}

          {workflow && step === 2 && recommended && (
            <section aria-label="Facility matching results" className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">Assessment → Facility match</p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">Why this facility?</h3>
                <p className="mt-1 text-xs text-muted">Eligible facilities are scored against the information you entered and current demo facility data.</p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">Recommended facility</p><h4 className="mt-1 font-display text-lg font-bold text-ink">{recommended.facility.name}</h4><p className="text-xs text-muted">{recommended.facility.location} · ~{recommended.facility.distanceKm} km away</p></div>
                  <p className="tabular font-display text-3xl font-bold text-teal-800">{recommended.score}<span className="text-xs font-medium text-muted"> / 100</span></p>
                </div>
                <div className="mt-4 space-y-2">
                  {recommended.factors.map((factor, index) => <FactorBar key={factor.key} label={factor.label} earned={factor.earned} max={factor.max} index={index} highlight={factor.earned === factor.max} />)}
                </div>
                <ul className="mt-4 grid gap-2 border-t border-teal-200 pt-3 sm:grid-cols-2">
                  {matchEvidence(previewCase, recommended, state.demoNow).map((reason) => <li key={reason} className="flex items-start gap-2 text-xs text-ink-2"><Check size={14} className="mt-0.5 shrink-0 text-teal-700" />{reason}</li>)}
                </ul>
              </div>
              {matches.eligible.length > 1 && <div><h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Other eligible facilities</h4><div className="mt-2 space-y-2">{matches.eligible.slice(1).map((matchItem) => <div key={matchItem.facility.id} className="rounded-lg border border-line bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-ink">{matchItem.facility.name}</strong><span className="tabular text-sm font-bold text-ink-2">{matchItem.score} / 100</span></div><p className="mt-1 text-[11px] text-muted">{matchItem.facility.services.includes(draft.requiredService) ? 'Provides required service' : 'Service unavailable'} · {matchItem.facility.status === 'available' ? 'Available' : 'Limited'} · ~{matchItem.facility.distanceKm} km · {matchItem.facility.bedsTotal - matchItem.facility.bedsOccupied} capacity available · {matchItem.facility.alwaysOpen ? '24-hour service' : 'Scheduled hours'}</p><p className="mt-1 text-[11px] text-ink-2"><strong>Why lower?</strong> {lowerMatchReasons(matchItem, recommended).join(' · ') || 'Lower overall combined match score.'}</p></div>)}</div></div>}
              {matches.excluded.length > 0 && <details className="rounded-lg border border-line bg-surface-2 px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-ink-2">Not eligible ({matches.excluded.length})</summary><ul className="mt-2 divide-y divide-line">{matches.excluded.map(({ facility, reason }) => <li key={facility.id} className="flex flex-wrap justify-between gap-2 py-2 text-xs"><span className="font-medium text-ink-2">{facility.name}</span><span className="text-urgent">{reason}</span></li>)}</ul></details>}
            </section>
          )}

          {workflow && step === 3 && (
            <section aria-label="Review new case" className="rounded-xl border border-line bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">Final review · Case #{nextCaseId(state.cases)}</p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">Review case</h3>
              <p className="mt-1 text-xs text-muted">This case, assessment, match, and timeline will be added to the shared coordination workspace.</p>
              <dl className="mt-4 grid gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-2">
                {[
                  ['Patient', `${draft.patientAlias} · ${draft.ageBand}`],
                  ['Location', draft.location],
                  ['Reported by', draft.context.reportedBy],
                  ['Care category', draft.categoryLabel],
                  ['Required service', draft.requiredServiceLabel],
                  ['Priority', `${priority.level.toUpperCase()} · ${priority.score}`],
                  ['Recommended facility', recommended?.facility.name ?? 'No eligible facility'],
                  ['Match score', recommended ? `${recommended.score} / 100` : '—'],
                  ['Transport', draft.factors.transportConstraint === 'needs_assisted_transport' ? 'Assisted transport required' : draft.factors.transportConstraint === 'remote_location' ? 'Remote location' : 'No special requirement'],
                  ['Follow-up', draft.factors.followUpUrgency === 'within_24h' ? 'Within 24 hours' : draft.factors.followUpUrgency === 'within_week' ? 'Within 1 week' : 'Routine'],
                ].map(([label, value]) => <div key={label}><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-ink">{value}</dd></div>)}
              </dl>
              <p className="mt-4 rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">{draft.summary}</p>
              <p className="mt-3 text-[11px] text-muted">Demo coordination rules — not clinical advice.</p>
            </section>
          )}

          {workflow && step === 4 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-auto w-full max-w-2xl rounded-xl border border-success/25 bg-success-bg p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-success"><Check size={22} /></span>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-success">Case created</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-ink">Case #{createdCaseId} is now active.</h3>
              <div className="mt-5 grid gap-4 border-y border-success/20 py-4 sm:grid-cols-2">
                <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Priority</p><p className="mt-1 text-sm font-bold text-urgent">{priority.level.toUpperCase()} · {priority.score}</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Recommended facility</p><p className="mt-1 text-sm font-semibold text-ink">{recommended?.facility.name}</p><p className="text-xs text-muted">{recommended?.score} / 100 match</p></div>
                <div className="sm:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Next action</p><p className="mt-1 text-sm font-semibold text-ink">Confirm Facility</p><p className="text-xs text-muted">The case and its explainable recommendation are now in the dashboard.</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2"><Link to={`/cases/${createdCaseId}`} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Open Case</Link><Link to="/dashboard" className="rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface">Go to Dashboard</Link></div>
            </motion.section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {(!workflow || step < 4) && <><p className="text-[11px] text-muted">Demo coordination rules — not clinical advice.</p><div className="flex flex-wrap gap-2">
              {workflow && step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-lg border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2">Back</button>}
              <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2">{workflow ? 'Exit' : 'Cancel'}</button>
              <button type="submit" disabled={workflow && step === 2 && !recommended} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45">{editing ? 'Recalculate & Save' : workflow ? ['Continue to assessment', 'Review facility matches', 'Review case', 'Create Case'][step] : 'Create Case'}</button>
            </div></>}
          </div>
        </div>

        {!(workflow && step === 4) && <motion.aside layout className="h-fit rounded-xl border border-line bg-surface-2 p-4 lg:sticky lg:top-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-700">Live assessment</p>
          <p className="mt-2 text-sm font-semibold text-ink">{draft.categoryLabel}</p>
          <p className="text-xs text-muted">{draft.requiredServiceLabel}</p>
          <div className="my-4 space-y-2 border-y border-line py-3 text-xs">
            {[
              ['Same-day coordination', draft.factors.timeSensitivity === 'same_day'],
              ['Specialized service', draft.factors.specializedServiceNeeded],
              ['Referral required', draft.factors.referralRequired],
              ['Assisted transport', draft.factors.transportConstraint === 'needs_assisted_transport'],
              ['Follow-up within 24h', draft.factors.followUpUrgency === 'within_24h'],
            ].map(([label, active]) => (
              <div key={String(label)} className="flex items-center justify-between gap-2">
                <span className="text-ink-2">{label}</span>
                <span className={active ? 'font-semibold text-teal-700' : 'text-muted'}>{active ? <Check size={14} /> : '—'}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Priority preview</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-sm font-bold uppercase ${priority.level === 'urgent' ? 'text-urgent' : priority.level === 'priority' ? 'text-priority' : 'text-ink'}`}>{priority.level}</span>
            <span className="tabular font-display text-3xl font-bold text-ink">{priority.score}</span>
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Facility match preview</p>
          {recommended ? (
            <div className="mt-1 rounded-lg bg-white p-3 ring-1 ring-inset ring-line">
              <p className="text-xs font-semibold text-ink">{recommended.facility.name}</p>
              <p className="mt-0.5 text-xs text-teal-700"><b className="tabular">{recommended.score}/100</b> · {matches.eligible.length} eligible</p>
            </div>
          ) : (
            <p className="mt-1 rounded-lg bg-urgent-bg p-3 text-xs text-urgent">No eligible facility for this service right now.</p>
          )}
          <p className="mt-3 text-[10px] leading-relaxed text-muted">Scores update from the assessment details and current demo facility availability.</p>
        </motion.aside>}
      </form>
    </section>
  )
}