import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, CircleAlert } from 'lucide-react'
import { useStore } from '@/state/store'
import { dueLabel } from '@/engine/time'
import { nextActionFor } from '@/engine/workflow'

export function FollowUpView() {
  const { state } = useStore()
  const queue = state.cases
    .filter((caseItem) => ['arrived', 'followup_due', 'followup_overdue', 'followup_completed'].includes(caseItem.status))
    .sort((a, b) => {
      const rank = (status: string) => status === 'followup_overdue' ? 0 : status === 'arrived' ? 1 : status === 'followup_due' ? 2 : 3
      return rank(a.status) - rank(b.status) || (a.followUp.scheduledFor ?? '').localeCompare(b.followUp.scheduledFor ?? '')
    })
  const dueCount = queue.filter((caseItem) => ['arrived', 'followup_due', 'followup_overdue'].includes(caseItem.status)).length
  const completedCount = queue.filter((caseItem) => caseItem.status === 'followup_completed').length

  return (
    <div className="space-y-6">
      <header className="border-b border-line pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">Continuity of coordination</p>
        <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-ink">Follow-up desk</h1>
        <p className="mt-1 text-sm text-ink-2">A focused worklist for arrivals and follow-up commitments.</p>
      </header>
      <div className="flex flex-wrap items-center gap-5 text-xs text-ink-2">
        <span className="inline-flex items-center gap-2"><Clock3 size={14} className="text-priority" />{dueCount} need coordination</span>
        <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-success" />{completedCount} completed</span>
      </div>
      <ol className="divide-y divide-line border-y border-line bg-surface">
        {queue.map((caseItem) => {
          const overdue = caseItem.status === 'followup_overdue'
          const complete = caseItem.status === 'followup_completed'
          const arrived = caseItem.status === 'arrived'
          const action = nextActionFor(caseItem)
          return (
            <li key={caseItem.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[42px_minmax(0,1fr)_190px_auto] sm:items-center sm:px-5">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${overdue ? 'bg-urgent-bg text-urgent' : complete ? 'bg-success-bg text-success' : 'bg-priority-bg text-priority'}`}>
                {overdue ? <CircleAlert size={17} /> : complete ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
              </span>
              <div className="min-w-0"><Link to={`/cases/${caseItem.id}`} className="text-sm font-bold text-ink hover:text-teal-800">Case #{caseItem.id} · {caseItem.patientAlias}</Link><p className="mt-1 text-xs text-muted">{caseItem.location} · {caseItem.categoryLabel}</p></div>
              <div><p className={`text-xs font-semibold ${overdue ? 'text-urgent' : complete ? 'text-success' : 'text-ink-2'}`}>{overdue ? 'Follow-up overdue' : complete ? 'Completed' : arrived ? 'Arrival · schedule follow-up' : 'Follow-up due'}</p><p className="mt-1 text-[11px] text-muted">{complete && caseItem.followUp.completedAt ? `Completed at ${caseItem.followUp.completedAt.slice(11, 16)}` : caseItem.followUp.scheduledFor ? dueLabel(caseItem.followUp.scheduledFor, state.demoNow) : arrived ? 'No follow-up date yet' : ''}</p></div>
              <Link to={`/cases/${caseItem.id}`} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-50">{complete ? 'Open record' : action.label}<ArrowRight size={13} /></Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
