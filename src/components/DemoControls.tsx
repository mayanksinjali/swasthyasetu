import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertOctagon, ChevronDown, Clock4, RotateCcw, UserX, Ambulance } from 'lucide-react'
import type { Case } from '@/types'
import { useStore, type Action } from '@/state/store'

export function DemoControls({ caseItem }: { caseItem?: Case }) {
  const [open, setOpen] = useState(false)
  const { state, dispatch } = useStore()
  const canSimulateFacility = caseItem && ['assessed', 'facility_recommended', 'referral_pending', 'referral_accepted'].includes(caseItem.status) && caseItem.selectedFacilityId
  const canSimulateDecline = caseItem?.status === 'referral_pending'

  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface-2/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <AlertOctagon size={13} />
          Demo Controls
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-muted ring-1 ring-inset ring-line">
            simulated events
          </span>
        </span>
        <ChevronDown size={15} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 border-t border-dashed border-line-strong px-4 py-3">
              {caseItem && canSimulateFacility && (
                <DemoBtn
                  icon={AlertOctagon}
                  label="Simulate Facility Unavailable"
                  onClick={() => dispatch({ type: 'SIMULATE_FACILITY_UNAVAILABLE', caseId: caseItem.id })}
                />
              )}
              {caseItem && canSimulateDecline && (
                <DemoBtn
                  icon={UserX}
                  label="Simulate Facility Decline"
                  onClick={() => dispatch({ type: 'SIMULATE_FACILITY_DECLINE', caseId: caseItem.id })}
                />
              )}
              {caseItem && ['transport_assigned', 'referral_accepted'].includes(caseItem.status) && (
                <DemoBtn
                  icon={Ambulance}
                  label="Simulate Transport Unavailable"
                  onClick={() => {
                    const seq: Action[] = [
                      { type: 'REQUEST_TRANSPORT', caseId: caseItem.id },
                      { type: 'SIMULATE_TRANSPORT_DELAY', caseId: caseItem.id },
                    ]
                    seq.forEach(dispatch)
                  }}
                />
              )}
              <DemoBtn
                icon={Clock4}
                label="Advance Demo Clock +1 Day"
                onClick={() => dispatch({ type: 'ADVANCE_CLOCK' })}
              />
              <DemoBtn
                icon={RotateCcw}
                label="Reset Demo"
                danger
                onClick={() => dispatch({ type: 'RESET_DEMO' })}
              />
              <span className="self-center text-[11px] text-muted">
                Demo clock: {state.demoNow.replace('T', ' · ')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DemoBtn({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: typeof Clock4
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
        danger
          ? 'bg-surface text-urgent ring-urgent/30 hover:bg-urgent-bg'
          : 'bg-surface text-ink-2 ring-line-strong hover:bg-teal-50 hover:text-teal-800'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
