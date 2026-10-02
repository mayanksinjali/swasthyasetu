import { Building2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { isOpenAt } from '@/engine/time'

const SERVICE_LABELS: Record<string, string> = {
  maternity: 'Maternity',
  emergency: 'Emergency',
  imaging: 'Imaging',
  specialist: 'Specialist',
  pediatric: 'Pediatric',
  basic: 'Basic services',
  minor_injury: 'Minor injury',
  chronic: 'Chronic review',
  mental_health: 'Mental wellbeing',
}

export function FacilitiesView() {
  const { state } = useStore()
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Facilities</h1>
        <p className="mt-0.5 text-sm text-ink-2">Network availability, live from shared coordination state.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {state.facilities.map((f) => {
          const open = isOpenAt(f, state.demoNow)
          const free = f.bedsTotal - f.bedsOccupied
          const statusStyle =
            f.status === 'available'
              ? 'bg-success-bg text-success ring-success/25'
              : f.status === 'limited'
                ? 'bg-priority-bg text-priority ring-priority/25'
                : 'bg-urgent-bg text-urgent ring-urgent/25'
          return (
            <article key={f.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h2 className="font-display text-[15px] font-bold text-ink">{f.name}</h2>
                    <p className="text-xs text-muted">{f.location} · ~{f.distanceKm} km</p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusStyle}`}>
                  {f.status === 'available' ? 'Available' : f.status === 'limited' ? 'Limited' : 'Unavailable'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.services.map((s) => (
                  <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
                    {SERVICE_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
              <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Hours</dt>
                  <dd className={`font-medium ${open ? 'text-ink-2' : 'text-urgent'}`}>
                    {f.alwaysOpen ? 'Open 24/7' : `${f.openTime}–${f.closeTime}`} · {open ? 'Open now' : 'Closed now'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Capacity</dt>
                  <dd className="tabular font-medium text-ink-2">{free} of {f.bedsTotal} beds free</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Referrals</dt>
                  <dd className={`font-medium ${f.acceptingReferrals ? 'text-success' : 'text-urgent'}`}>
                    {f.acceptingReferrals ? 'Accepting' : 'Not accepting'}
                  </dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </div>
  )
}
