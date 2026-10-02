import { Ambulance, Bus, Bike } from 'lucide-react'
import { useStore } from '@/state/store'

const TYPE_ICON = { ambulance: Ambulance, van: Bus, motorbike: Bike } as const

export function TransportView() {
  const { state } = useStore()
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Transport</h1>
        <p className="mt-0.5 text-sm text-ink-2">Fleet availability, live from shared coordination state.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {state.transportResources.map((r) => {
          const Icon = TYPE_ICON[r.type]
          const statusStyle =
            r.status === 'available'
              ? 'bg-success-bg text-success ring-success/25'
              : r.status === 'busy'
                ? 'bg-priority-bg text-priority ring-priority/25'
                : 'bg-urgent-bg text-urgent ring-urgent/25'
          return (
            <article key={r.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h2 className="font-display text-[15px] font-bold text-ink">{r.name}</h2>
                    <p className="text-xs capitalize text-muted">{r.type} · {r.supportsAssisted ? 'assisted transport' : 'no assisted support'}</p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyle}`}>
                  {r.status}
                </span>
              </div>
              <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">ETA</dt>
                  <dd className="tabular font-medium text-ink-2">{r.etaMinutes !== undefined ? `${r.etaMinutes} min` : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Assigned case</dt>
                  <dd className="tabular font-medium text-ink-2">{r.assignedCaseId ? `#${r.assignedCaseId}` : r.reservedForCaseId ? `#${r.reservedForCaseId}` : '—'}</dd>
                </div>
                {r.note && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted">Note</dt>
                    <dd className="text-right font-medium text-ink-2">{r.note}</dd>
                  </div>
                )}
              </dl>
            </article>
          )
        })}
      </div>
    </div>
  )
}
