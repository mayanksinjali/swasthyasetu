import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import type { CaseStatus, Priority } from '@/types'
import { useStore } from '@/state/store'
import { PriorityBadge, StatusBadge, TransportBadge, FollowUpBadge, statusLabel } from '@/components/badges'
import { priorityLevel } from '@/engine/priority'
import { shortDateTime } from '@/engine/time'

type SortKey = 'priority' | 'received' | 'status'

const STATUS_ORDER: CaseStatus[] = [
  'new', 'assessed', 'facility_recommended', 'referral_pending', 'referral_accepted',
  'transport_assigned', 'in_transit', 'arrived', 'followup_due', 'followup_completed',
  'facility_unavailable', 'referral_declined', 'transport_delayed', 'followup_overdue',
]

const CATEGORIES = ['All', 'Maternal Care', 'Imaging', 'Specialist', 'Pediatric', 'Chronic Review', 'General Care']

function facilityName(state: ReturnType<typeof useStore>['state'], id?: string): string {
  if (!id) return '—'
  return state.facilities.find((f) => f.id === id)?.name ?? '—'
}

export function CasesView() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | CaseStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  const rows = useMemo(() => {
    let list = [...state.cases]
    if (priorityFilter !== 'all') list = list.filter((c) => (c.priority?.level ?? priorityLevel(0)) === priorityFilter)
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
    if (categoryFilter !== 'All') list = list.filter((c) => c.categoryLabel === categoryFilter)
    if (query.trim()) list = list.filter((c) => c.id.includes(query.trim()))
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'priority') cmp = (b.priority?.score ?? 0) - (a.priority?.score ?? 0)
      else if (sortKey === 'received') cmp = a.receivedAt.localeCompare(b.receivedAt)
      else cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      return cmp * sortDir
    })
    return list
  }, [state.cases, priorityFilter, statusFilter, categoryFilter, query, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(k)
      setSortDir(-1)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Cases</h1>
          <p className="mt-0.5 text-sm text-ink-2">Every referral in the coordination pipeline.</p>
        </div>
        <button onClick={() => navigate('/cases/new')} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
          <Plus size={16} /> New Case
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case ID…"
            className="w-44 rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-muted focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as 'all' | Priority)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-2 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="priority">Priority</option>
          <option value="routine">Routine</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | CaseStatus)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-2 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-2 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted">{rows.length} of {state.cases.length} cases</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">
                <SortBtn label="Case" active={sortKey === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
              </th>
              <th className="px-4 py-3 font-semibold">
                <SortBtn label="Received" active={sortKey === 'received'} dir={sortDir} onClick={() => toggleSort('received')} />
              </th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">
                <SortBtn label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
              </th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Facility</th>
              <th className="px-4 py-3 font-semibold">Transport</th>
              <th className="px-4 py-3 font-semibold">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} className="group transition-colors hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link to={`/cases/${c.id}`} className="tabular font-bold text-teal-700 hover:underline">
                    #{c.id}
                  </Link>
                </td>
                <td className="tabular px-4 py-3 text-xs text-muted">{shortDateTime(c.receivedAt)}</td>
                <td className="px-4 py-3">
                  {c.priority ? <PriorityBadge level={c.priority.level} score={c.priority.score} size="sm" /> : <span className="text-xs text-muted">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
                <td className="px-4 py-3 text-[13px] text-ink-2">{c.categoryLabel}</td>
                <td className="px-4 py-3 text-[13px] text-ink-2">{c.location}</td>
                <td className="px-4 py-3 text-[13px] text-ink-2">{facilityName(state, c.selectedFacilityId)}</td>
                <td className="px-4 py-3"><TransportBadge status={c.transport.status} /></td>
                <td className="px-4 py-3"><FollowUpBadge status={c.followUp.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((c) => (
          <Link
            key={c.id}
            to={`/cases/${c.id}`}
            className="block rounded-xl border border-line bg-surface p-4 shadow-card active:bg-teal-50/40"
          >
            <div className="flex items-center gap-2">
              <span className="tabular text-sm font-bold">#{c.id}</span>
              {c.priority && <PriorityBadge level={c.priority.level} score={c.priority.score} size="sm" />}
            </div>
            <div className="mt-1 text-xs text-muted">{c.categoryLabel} · {c.location}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge status={c.status} size="sm" />
              <TransportBadge status={c.transport.status} />
              <FollowUpBadge status={c.followUp.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SortBtn({ label, active, dir, onClick }: { label: string; active: boolean; dir: 1 | -1; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? 'text-teal-700' : 'hover:text-ink-2'}`}>
      {label}
      {active && (dir === -1 ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
    </button>
  )
}
