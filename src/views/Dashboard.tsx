import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronRight, Plus } from 'lucide-react'
import type { Case } from '@/types'
import { useStore } from '@/state/store'
import { PriorityBadge, StatusBadge } from '@/components/badges'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Timeline } from '@/components/Timeline'
import { DemoControls } from '@/components/DemoControls'
import { isBlocked, nextActionFor } from '@/engine/workflow'
import { relativeTime as _rt, dueLabel as _dl, isPast as _ip, addDays, parse } from '@/engine/time'
void _rt; void _dl; void _ip

// ─── Derived metrics ──────────────────────────────────────────────────────────

function useMetrics() {
  const { state } = useStore()
  return useMemo(() => {
    const active = state.cases.filter((c) => c.status !== 'followup_completed')
    const awaiting = state.cases.filter((c) => c.status === 'referral_pending')
    const transportActive = state.cases.filter((c) =>
      ['transport_assigned', 'in_transit'].includes(c.status) && c.transport.status !== 'not_requested',
    )
    const followupsDue = state.cases.filter((c) => ['followup_due', 'followup_overdue'].includes(c.status))
    const completed = state.cases.filter((c) => c.status === 'followup_completed')
    return {
      active: active.length,
      urgent: state.cases.filter((c) => c.status !== 'followup_completed' && c.priority?.level === 'urgent').length,
      awaiting: awaiting.length,
      transport: transportActive.length,
      followups: followupsDue.length,
      completed: completed.length,
    }
  }, [state.cases])
}

// ─── Attention sort ───────────────────────────────────────────────────────────

function attentionRank(c: Case): number {
  if (c.status === 'followup_completed') return 90
  if (isBlocked(c.status)) {
    if (c.status === 'followup_overdue') return 2
    if (c.status === 'transport_delayed') return 1
    return 3
  }
  const level = c.priority?.level ?? 'routine'
  if (level === 'urgent') return 0
  if (c.status === 'referral_pending') return 4
  if (c.status === 'followup_due') return 5
  if (c.status === 'followup_overdue') return 2
  return 10
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { state } = useStore()
  const reduced = useReducedMotion()
  const metrics = useMetrics()

  const attention = useMemo(() => {
    return [...state.cases].sort((a, b) => {
      const ra = attentionRank(a)
      const rb = attentionRank(b)
      if (ra !== rb) return ra - rb
      const pa = a.priority?.score ?? 0
      const pb = b.priority?.score ?? 0
      if (pa !== pb) return pb - pa
      return parse(b.receivedAt).getTime() - parse(a.receivedAt).getTime()
    })
  }, [state.cases, state.demoNow])

  const pipeline = useMemo(() => {
    const count = (pred: (c: Case) => boolean) => state.cases.filter(pred).length
    return [
      { label: 'Assessed', n: count((c) => ['assessed', 'facility_recommended'].includes(c.status)) },
      { label: 'Referral', n: count((c) => ['referral_pending', 'referral_accepted'].includes(c.status)) },
      { label: 'Transport', n: count((c) => ['transport_assigned', 'in_transit', 'transport_delayed'].includes(c.status)) },
      { label: 'Arrived', n: count((c) => ['arrived'].includes(c.status)) },
      { label: 'Follow-up', n: count((c) => ['followup_due', 'followup_overdue'].includes(c.status)) },
      { label: 'Complete', n: count((c) => c.status === 'followup_completed') },
    ]
  }, [state.cases])

  const impact = useMemo(() => {
    const completed = state.cases.filter((c) => c.status === 'followup_completed')
    const weekAgo = addDays(state.demoNow, -7)
    const thisWeek = completed.filter((c) => c.followUp.completedAt && parse(c.followUp.completedAt) >= parse(weekAgo))
    const followupsScheduled = state.cases.filter((c) => c.followUp.status !== 'not_scheduled')
    const followupsCompleted = state.cases.filter((c) => c.followUp.status === 'completed')
    const rate = followupsScheduled.length === 0 ? 0 : Math.round((followupsCompleted.length / followupsScheduled.length) * 100)
    // Deterministic demo coordination-time figure: mean of received→completed for completed cases (clamped, minutes → hours)
    const durations = completed
      .filter((c) => c.followUp.completedAt)
      .map((c) => (parse(c.followUp.completedAt!).getTime() - parse(c.receivedAt).getTime()) / 3600000)
    const avgH = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    return {
      completedThisWeek: thisWeek.length,
      avgHours: Math.round(avgH),
      followupRate: rate,
    }
  }, [state.cases, state.demoNow])

  const recent = useMemo(
    () => [...state.timeline].sort((a, b) => parse(b.at).getTime() - parse(a.at).getTime()).slice(0, 8),
    [state.timeline],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-600">Health Bridge · Rupandehi</p>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-tight text-ink md:text-[32px]">
            SwasthyaSetu <span className="font-semibold text-muted">Command Center</span>
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            Coordinate referrals, transport, and follow-up from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/cases/new" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
            <Plus size={15} /> New Case
          </Link>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3.5 py-2 text-sm font-medium text-ink-2 ring-1 ring-inset ring-line-strong transition-colors hover:bg-teal-50 hover:text-teal-800"
          >
            All cases <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <section aria-label="Live metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Active cases', value: metrics.active, tone: 'text-ink' },
          { label: 'Urgent', value: metrics.urgent, tone: metrics.urgent > 0 ? 'text-urgent' : 'text-ink' },
          { label: 'Awaiting acceptance', value: metrics.awaiting, tone: metrics.awaiting > 0 ? 'text-priority' : 'text-ink' },
          { label: 'Transport active', value: metrics.transport, tone: 'text-teal-700' },
          { label: 'Follow-ups due', value: metrics.followups, tone: metrics.followups > 0 ? 'text-priority' : 'text-ink' },
          { label: 'Completed', value: metrics.completed, tone: 'text-success' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card"
          >
            <div className={`text-[26px] font-bold leading-none ${m.tone}`}>
              <AnimatedNumber value={m.value} />
            </div>
            <div className="mt-1.5 text-[11px] font-medium leading-tight text-muted">{m.label}</div>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention queue — centerpiece */}
        <section aria-label="Needs attention" className="lg:col-span-2">
          <div className="rounded-2xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">Needs Attention</h2>
                <p className="text-xs text-muted">Sorted by urgency, blocks, and follow-ups</p>
              </div>
              <span className="tabular rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-2">
                {metrics.active} active
              </span>
            </div>
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {attention.map((c, i) => {
                  const action = nextActionFor(c)
                  const rank = attentionRank(c)
                  const isGolden = c.id === '1042'
                  const overdueDays =
                    c.status === 'followup_overdue' && c.followUp.scheduledFor
                      ? Math.max(1, Math.round((parse(state.demoNow).getTime() - parse(c.followUp.scheduledFor).getTime()) / 86400000))
                      : 0
                  return (
                    <motion.li
                      key={c.id}
                      layout={!reduced}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.3) }}
                    >
                      <Link
                        to={`/cases/${c.id}`}
                        className={`group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-teal-50/40 ${
                          isGolden && rank <= 1 ? 'bg-teal-50/50' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tabular text-sm font-bold text-ink">#{c.id}</span>
                            {c.priority && <PriorityBadge level={c.priority.level} score={c.priority.score} size="sm" />}
                            <StatusBadge status={c.status} size="sm" />
                            {overdueDays > 0 && (
                              <span className="rounded-md bg-urgent-bg px-1.5 py-0.5 text-[10px] font-semibold text-urgent">
                                Overdue by {overdueDays} day{overdueDays === 1 ? '' : 's'}
                              </span>
                            )}
                            {isGolden && rank <= 1 && (
                              <span className="rounded-md bg-teal-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                Top priority
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                            <span className="font-medium text-ink-2">{c.categoryLabel}</span>
                            <span>{c.location}</span>
                            <span>·</span>
                            <span>Next: <span className="font-medium text-teal-700">{action.label}</span></span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-line-strong transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
                      </Link>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>
        </section>

        {/* Right rail: pipeline + impact + activity */}
        <div className="space-y-6">
          {/* Pipeline */}
          <section aria-label="Referral pipeline" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Referral Pipeline</h2>
            <ol className="mt-3 space-y-0">
              {pipeline.map((p, i) => (
                <li key={p.label} className="flex items-center gap-3">
                  <div className="flex w-full items-center gap-3">
                    <span className="tabular w-7 shrink-0 rounded-md bg-teal-50 py-0.5 text-center text-xs font-bold text-teal-700 ring-1 ring-inset ring-teal-200">
                      {p.n}
                    </span>
                    <span className="text-[13px] font-medium text-ink-2">{p.label}</span>
                    {i < pipeline.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Impact strip */}
          <section aria-label="Impact" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">This Week</h2>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <dt className="text-[13px] text-ink-2">Referrals completed</dt>
                <dd className="tabular text-sm font-bold text-ink">
                  <AnimatedNumber value={impact.completedThisWeek} />
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-[13px] text-ink-2">Avg coordination time</dt>
                <dd className="tabular text-sm font-bold text-ink">
                  <AnimatedNumber value={impact.avgHours} /> h <span className="text-[10px] font-normal text-muted">demo</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-[13px] text-ink-2">Follow-up completion</dt>
                <dd className="tabular text-sm font-bold text-ink">
                  <AnimatedNumber value={impact.followupRate} />%
                </dd>
              </div>
            </dl>
          </section>

          {/* Recent activity */}
          <section aria-label="Recent activity" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Recent Activity</h2>
            <div className="mt-3">
              <Timeline events={recent} compact />
            </div>
          </section>
        </div>
      </div>

      <DemoControls />
    </div>
  )
}
