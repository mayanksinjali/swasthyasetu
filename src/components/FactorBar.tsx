import { motion, useReducedMotion } from 'framer-motion'

export function FactorBar({
  label,
  earned,
  max,
  index,
  highlight = false,
}: {
  label: string
  earned: number
  max: number
  index: number
  highlight?: boolean
}) {
  const reduced = useReducedMotion()
  const pct = max === 0 ? 0 : Math.min(100, (earned / max) * 100)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className={highlight ? 'font-medium text-ink' : 'text-ink-2'}>{label}</span>
        <span className={`tabular font-semibold ${highlight ? 'text-teal-700' : 'text-ink-2'}`}>
          +{earned}
          <span className="ml-0.5 font-normal text-muted">/ {max}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={`h-full rounded-full ${highlight ? 'bg-teal-500' : 'bg-teal-300'}`}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.15 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}
