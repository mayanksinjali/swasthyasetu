import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { ReferralBadge, StatusBadge } from '@/components/badges'
import { nextActionFor } from '@/engine/workflow'

export function ReferralsView() {
  const { state, matches } = useStore()
  const referrals = state.cases
    .filter((caseItem) => caseItem.referral || ['assessed', 'facility_recommended', 'facility_unavailable', 'referral_declined'].includes(caseItem.status))
    .sort((a, b) => Number(a.status === 'followup_completed') - Number(b.status === 'followup_completed') || b.receivedAt.localeCompare(a.receivedAt))

  return (
    <div className="space-y-6">
      <header className="border-b border-line pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">Referral coordination</p>
        <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight text-ink">Referral desk</h1>
        <p className="mt-1 text-sm text-ink-2">Facility decisions and acceptance status, connected to each case.</p>
      </header>
      <div className="divide-y divide-line border-y border-line bg-surface">
        {referrals.map((caseItem) => {
          const facility = caseItem.selectedFacilityId ? state.facilities.find((item) => item.id === caseItem.selectedFacilityId) : undefined
          const recommendation = matches(caseItem.id).eligible[0]
          const action = nextActionFor(caseItem)
          return (
            <article key={caseItem.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[100px_minmax(0,1fr)_170px_auto] sm:items-center sm:px-5">
              <div><Link to={`/cases/${caseItem.id}`} className="tabular text-sm font-bold text-teal-800 hover:underline">Case #{caseItem.id}</Link><p className="mt-1 text-[10px] text-muted">{caseItem.location}</p></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{facility?.name ?? recommendation?.facility.name ?? 'No eligible facility'}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Building2 size={12} />{facility ? 'Selected facility' : recommendation ? `Recommended · ${recommendation.score}/100` : 'Review assessment to continue'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">{caseItem.referral ? <ReferralBadge status={caseItem.referral.status} /> : <StatusBadge status={caseItem.status} size="sm" />}<span className="text-[10px] text-muted">{action.label}</span></div>
              <Link to={`/cases/${caseItem.id}`} aria-label={`Open case ${caseItem.id}`} className="grid h-8 w-8 place-items-center rounded-md text-teal-700 hover:bg-teal-50"><ArrowRight size={15} /></Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
