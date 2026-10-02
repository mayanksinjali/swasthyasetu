import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { CaseStatus } from '@/types'
import { WORKFLOW_STEPS, stepIndexFor, isBlocked } from '@/engine/workflow'

export function WorkflowStepper({ status }: { status: CaseStatus }) {
  const reduced = useReducedMotion()
  const current = stepIndexFor(status)
  const blocked = isBlocked(status)

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      <ol className="flex min-w-max items-stretch gap-0">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          const isBlockedStep = blocked && i === current
          const isFinalActive = active && status === 'followup_completed'
          return (
            <li key={step.key} className="flex items-center">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${
                  isBlockedStep
                    ? 'bg-urgent-bg ring-1 ring-inset ring-urgent/25'
                    : isFinalActive
                      ? 'bg-success-bg ring-1 ring-inset ring-success/25'
                      : active
                        ? 'bg-teal-50 ring-1 ring-inset ring-teal-300'
                        : ''
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset ${
                    done
                      ? 'bg-teal-500 text-white ring-teal-500'
                      : isBlockedStep
                        ? 'bg-urgent text-white ring-urgent'
                        : isFinalActive
                          ? 'bg-success text-white ring-success'
                          : active
                            ? 'bg-white text-teal-700 ring-teal-400'
                            : 'bg-surface-2 text-muted ring-line'
                  }`}
                >
                  {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-medium ${
                    isBlockedStep ? 'text-urgent' : isFinalActive ? 'text-success' : active ? 'text-teal-800' : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="relative mx-1 h-px w-4 shrink-0 bg-line-strong">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-teal-500"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
