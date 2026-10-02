import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, Ambulance, Building2, CalendarClock, ClipboardList, HeartPulse, Users } from 'lucide-react'
import { StoreProvider, useStore } from '@/state/store'
import { clockTime, dateTimeLabel } from '@/engine/time'

const LandingPage = lazy(() => import('@/views/LandingPage').then((module) => ({ default: module.LandingPage })))
const NewCasePage = lazy(() => import('@/views/NewCasePage').then((module) => ({ default: module.NewCasePage })))
const Dashboard = lazy(() => import('@/views/Dashboard').then((module) => ({ default: module.Dashboard })))
const CasesView = lazy(() => import('@/views/Cases').then((module) => ({ default: module.CasesView })))
const CaseWorkspace = lazy(() => import('@/views/CaseWorkspace').then((module) => ({ default: module.CaseWorkspace })))
const ReferralsView = lazy(() => import('@/views/Referrals').then((module) => ({ default: module.ReferralsView })))
const FacilitiesView = lazy(() => import('@/views/Facilities').then((module) => ({ default: module.FacilitiesView })))
const TransportView = lazy(() => import('@/views/Transport').then((module) => ({ default: module.TransportView })))
const FollowUpView = lazy(() => import('@/views/FollowUp').then((module) => ({ default: module.FollowUpView })))

const NAV = [
  { to: '/dashboard', label: 'Command Center', icon: Activity, end: true },
  { to: '/cases', label: 'Cases', icon: Users, end: false },
  { to: '/referrals', label: 'Referrals', icon: ClipboardList, end: false },
  { to: '/facilities', label: 'Facilities', icon: Building2, end: false },
  { to: '/transport', label: 'Transport', icon: Ambulance, end: false },
  { to: '/follow-up', label: 'Follow-up', icon: CalendarClock, end: false },
]

function Shell({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 md:flex">
        <button className="mb-8 flex items-center gap-3 text-left" onClick={() => navigate('/')} aria-label="SwasthyaSetu homepage">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-card">
            <HeartPulse size={20} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block font-display text-[17px] font-bold leading-tight tracking-tight text-ink">
              SwasthyaSetu
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              Health Bridge
            </span>
          </span>
        </button>

        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl bg-surface-2 px-3.5 py-3 ring-1 ring-inset ring-line">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Demo clock</div>
            <div className="tabular mt-0.5 text-sm font-semibold text-ink">{dateTimeLabel(state.demoNow)}</div>
            <div className="mt-1 text-[11px] leading-snug text-muted">
              Deterministic · advances via Demo Controls
            </div>
          </div>
          <p className="px-1 text-[10.5px] leading-relaxed text-muted">
            Fictional demo data · Not a medical device
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="flex items-center gap-2" onClick={() => navigate('/')} aria-label="SwasthyaSetu homepage">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <HeartPulse size={16} strokeWidth={2.2} />
              </span>
              <span className="font-display text-[15px] font-bold tracking-tight">SwasthyaSetu</span>
            </button>
            <span className="tabular rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold text-ink-2 ring-1 ring-inset ring-line">
              {clockTime(state.demoNow)}
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                    isActive ? 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200' : 'text-ink-2'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        <footer className="border-t border-line px-4 py-3 md:px-8">
          <p className="text-center text-[11px] text-muted">
            SwasthyaSetu · Community Health Referral Coordination · Fictional demo data · Not a medical device
          </p>
        </footer>
      </div>
    </div>
  )
}

function ShellRoute() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-bg text-sm text-muted">Loading coordination workspace…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cases/new" element={<NewCasePage />} />
          <Route element={<ShellRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CasesView />} />
            <Route path="/cases/:caseId" element={<CaseWorkspace />} />
            <Route path="/referrals" element={<ReferralsView />} />
            <Route path="/facilities" element={<FacilitiesView />} />
            <Route path="/transport" element={<TransportView />} />
            <Route path="/follow-up" element={<FollowUpView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </StoreProvider>
  )
}
