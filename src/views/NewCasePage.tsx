import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import { CaseIntakeForm } from '@/components/CaseIntakeForm'
import { useStore } from '@/state/store'

export function NewCasePage() {
  const navigate = useNavigate()
  const { dispatch } = useStore()

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex min-h-17 items-center justify-between border-b border-line bg-surface px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-ink no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700 text-white"><HeartPulse size={18} /></span>
          <span><strong className="block text-sm">SwasthyaSetu</strong><small className="block text-[9px] font-semibold uppercase tracking-[1.2px] text-muted">Health Bridge</small></span>
        </Link>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-teal-800"><ArrowLeft size={14} /> Dashboard</Link>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-7 sm:py-9">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-700">New referral intake</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">A clear start to a coordinated journey</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-2">Enter administrative details, review the deterministic priority and facility match, then create a case in the shared command center.</p>
        </div>
        <CaseIntakeForm
          workflow
          onClose={() => navigate('/dashboard')}
          onCreate={(caseData) => dispatch({ type: 'CREATE_CASE', caseData })}
        />
      </main>
      <footer className="border-t border-line px-4 py-3 text-center text-[11px] text-muted">Fictional demo data · Not a medical device</footer>
    </div>
  )
}
