import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { ArrowDownRight, ArrowRight, Ambulance, Building2, Check, HeartPulse, MapPin, Route, Sparkles, Stethoscope, Truck } from 'lucide-react'
import { useStore } from '@/state/store'
import { matchFacilities } from '@/engine/matching'

const PREVIEW_STEPS = [
  { eyebrow: '01 / PRIORITY', title: 'URGENT · 93', copy: 'Same-day coordination, explained.' },
  { eyebrow: '02 / FACILITY', title: '92 / 100', copy: 'Butwal Community Hospital · ~3 km' },
  { eyebrow: '03 / REFERRAL', title: 'Facility confirmed', copy: 'A clear handoff, with status in view.' },
  { eyebrow: '04 / TRANSPORT', title: 'Assisted transport', copy: 'Ambulance A-01 · ETA 12 min' },
  { eyebrow: '05 / FOLLOW-UP', title: 'Journey complete', copy: 'One connected coordination record.' },
]

const JOURNEY_STEPS = [
  { label: 'Referral', Icon: Building2 },
  { label: 'Accepted', Icon: Check },
  { label: 'Transport', Icon: Ambulance },
  { label: 'Arrival', Icon: MapPin },
  { label: 'Follow-up', Icon: Route },
]

const NETWORK_STEPS = [
  { key: 'received', label: 'Case received', detail: 'Butwal · Ward 11', Icon: MapPin, className: 'community-node' },
  { key: 'assessment', label: 'Assessment', detail: 'Priority calculated', Icon: Stethoscope, className: 'assess-node' },
  { key: 'facility', label: 'Facility matched', detail: 'Highest eligible score', Icon: Building2, className: 'match-node' },
  { key: 'referral', label: 'Referral accepted', detail: 'Facility handoff', Icon: Check, className: 'referral-node' },
  { key: 'transport', label: 'Transport', detail: 'Ambulance A-01 · 12 min', Icon: Truck, className: 'transport-node' },
  { key: 'followup', label: 'Follow-up', detail: 'Scheduled · journey complete', Icon: Route, className: 'follow-node' },
]

const NETWORK_EDGES = [
  { d: 'M220 65 L220 96', from: [220, 65], to: [220, 96] },
  { d: 'M220 146 L220 182', from: [220, 146], to: [220, 182] },
  { d: 'M220 232 L220 269', from: [220, 232], to: [220, 269] },
  { d: 'M220 319 L220 355', from: [220, 319], to: [220, 355] },
  { d: 'M220 405 L220 432', from: [220, 405], to: [220, 432] },
] as const

const heroCopyVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.04, staggerChildren: 0.075 } },
}

const heroItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42 } },
}

export function LandingPage() {
  const reduced = useReducedMotion()
  const { state } = useStore()
  const [previewStep, setPreviewStep] = useState(0)
  const goldenCase = state.cases.find((caseItem) => caseItem.id === '1042')
  const match = goldenCase ? matchFacilities(goldenCase, state.facilities, state.demoNow).eligible[0] : undefined

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => setPreviewStep((step) => (step + 1) % PREVIEW_STEPS.length), 3200)
    return () => window.clearInterval(timer)
  }, [reduced])

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="SwasthyaSetu home">
          <span className="landing-brand-mark"><HeartPulse size={19} strokeWidth={2.1} /></span>
          <span><strong>SwasthyaSetu</strong><small>Health Bridge</small></span>
        </Link>
        <nav aria-label="Main navigation" className="landing-nav-actions">
          <Link to="/dashboard" className="landing-nav-link">Dashboard</Link>
          <Link to="/cases/new" className="landing-nav-cta">Add Case <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <motion.div
              className="landing-hero-copy"
              initial={reduced ? false : 'hidden'}
              animate="visible"
              variants={reduced ? undefined : heroCopyVariants}
            >
              <motion.p variants={reduced ? undefined : heroItemVariants} className="landing-kicker"><span /> COMMUNITY HEALTH COORDINATION</motion.p>
              <h1 aria-label="Care moves forward when the details connect.">
                <motion.span variants={reduced ? undefined : heroItemVariants} className="hero-title-line" aria-hidden="true">Care moves forward</motion.span>
                <motion.span variants={reduced ? undefined : heroItemVariants} className="hero-title-line" aria-hidden="true">when the details</motion.span>
                <motion.span variants={reduced ? undefined : heroItemVariants} className="hero-title-line" aria-hidden="true"><em>connect.</em></motion.span>
              </h1>
              <motion.p variants={reduced ? undefined : heroItemVariants} className="landing-lede">SwasthyaSetu helps community health coordinators assess referrals, find suitable facilities, coordinate transport, and track follow-up from one connected workflow.</motion.p>
              <motion.div variants={reduced ? undefined : heroItemVariants} className="landing-hero-actions">
                <Link to="/cases/new" className="landing-button-primary">Add New Case <motion.span whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}><ArrowRight size={16} /></motion.span></Link>
                <Link to="/dashboard" className="landing-button-quiet">Open Dashboard <motion.span whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}><ArrowDownRight size={16} /></motion.span></Link>
              </motion.div>
              <motion.div variants={reduced ? undefined : heroItemVariants} className="landing-trust-line"><span><Check size={13} /> Explainable demo rules</span><span><Check size={13} /> Fictional records only</span></motion.div>
            </motion.div>

            <motion.div
              className="landing-hero-visual"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.48, delay: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Referral coordination network and product preview"
            >
              <NetworkVisual />
              <div className="landing-product-preview">
                <div className="preview-topline"><span>NEEDS ATTENTION</span><span className="preview-live-dot" /> <span>DEMO CASE</span></div>
                <div className="preview-case-heading">
                  <strong>#{goldenCase?.id ?? '1042'}</strong>
                  <span className="preview-urgent">{goldenCase?.priority?.level ?? 'urgent'} · {goldenCase?.priority?.score ?? 93}</span>
                </div>
                <p className="preview-case-detail">{goldenCase?.categoryLabel ?? 'Maternal Care'} <span>·</span> {goldenCase?.location ?? 'Butwal, Ward 11'}</p>
                <div className="preview-focus">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={previewStep}
                      initial={reduced ? false : { opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -7 }}
                      transition={{ duration: 0.24 }}
                    >
                      <small>{PREVIEW_STEPS[previewStep].eyebrow}</small>
                      <strong>{previewStep === 1 && match ? `${match.score} / 100` : PREVIEW_STEPS[previewStep].title}</strong>
                      <span>{previewStep === 1 && match ? match.facility.name : PREVIEW_STEPS[previewStep].copy}</span>
                    </motion.div>
                  </AnimatePresence>
                  <div className="preview-progress" aria-hidden="true">
                    {PREVIEW_STEPS.map((item, index) => <span key={item.eyebrow} className={index === previewStep ? 'is-active' : index < previewStep ? 'is-done' : ''} />)}
                  </div>
                </div>
                <div className="preview-footer"><span><MapPin size={12} /> Butwal coordination area</span><span>Not clinical advice</span></div>
              </div>
            </motion.div>
          </div>
          <div className="landing-hero-bottom"><span>FROM COMMUNITY REFERRAL</span><span className="landing-rule" /><span>TO FOLLOW-UP</span><span className="landing-scroll-note">A connected path, at every step <ArrowDownRight size={14} /></span></div>
        </section>

        <section className="landing-story-intro">
          <p className="landing-kicker landing-kicker-dark">ONE COORDINATED JOURNEY</p>
          <h2>Less time tracking handoffs.<br /><em>More clarity on what happens next.</em></h2>
          <p>From the first administrative details to follow-up, every step stays visible and connected.</p>
        </section>

        <section className="landing-story-grid" aria-label="How SwasthyaSetu works">
          <motion.article initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.35 }} className="story-panel story-panel-assess">
            <div className="story-index">01 <span>ASSESS</span></div>
            <h3>Start with<br /><em>what you know.</em></h3>
            <p>Coordinator-entered information becomes an explainable priority. No diagnosis, no clinical decision-making.</p>
            <div className="story-assessment-flow">
              <span>New case</span><i /><span>Assessment</span><i /><strong>Priority</strong>
            </div>
            <div className="story-priority"><span>TIME-SENSITIVE</span><strong>+40</strong><span>Assisted transport</span><strong>+10</strong><span>Follow-up within 24h</span><strong>+10</strong></div>
          </motion.article>
          <motion.article initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.35, delay: reduced ? 0 : 0.06 }} className="story-panel story-panel-match">
            <div className="story-index">02 <span>MATCH</span></div>
            <h3>A recommendation<br /><em>with its evidence.</em></h3>
            <p>Eligible facilities are ranked against service, availability, distance, capacity, and operating hours.</p>
            <div className="story-match-factors">
              {[['Service', 35], ['Availability', 25], ['Distance', 18], ['Capacity', 8], ['Open now', 6]].map(([label, points]) => (
                <div key={String(label)}><span>{label}</span><span className="factor-track"><i style={{ width: `${Number(points) * 2.4}%` }} /></span><strong>+{points}</strong></div>
              ))}
            </div>
            <div className="story-match-total"><span>Butwal Community Hospital</span><strong>92 <small>/ 100</small></strong></div>
          </motion.article>
          <motion.article initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.35, delay: reduced ? 0 : 0.12 }} className="story-panel story-panel-journey">
            <div className="story-index">03 <span>COORDINATE</span></div>
            <h3>Keep the journey<br /><em>moving forward.</em></h3>
            <p>Referral acceptance, transport, arrival, and follow-up all update one case record.</p>
            <div className="story-journey-flow">
              {JOURNEY_STEPS.map(({ label, Icon }, index) => <div key={label} className="journey-node"><span className={index === 0 ? 'journey-node-active' : ''}><Icon size={15} /></span><small>{label}</small></div>)}
            </div>
            <div className="story-journey-note"><span className="journey-pulse" /> One timeline. Every handoff.</div>
          </motion.article>
        </section>

        <section className="landing-final-cta">
          <div><p className="landing-kicker landing-kicker-dark"><Sparkles size={13} /> READY WHEN YOU ARE</p><h2>Ready to coordinate<br /><em>a case?</em></h2></div>
          <div className="landing-final-actions"><Link to="/cases/new" className="landing-button-primary">Add New Case <ArrowRight size={16} /></Link><Link to="/dashboard" className="landing-button-quiet">Open Dashboard <ArrowRight size={15} /></Link></div>
        </section>
      </main>

      <footer className="landing-footer"><Link to="/" className="landing-brand"><span className="landing-brand-mark"><HeartPulse size={17} /></span><span><strong>SwasthyaSetu</strong><small>Health Bridge</small></span></Link><p>Fictional demo data · Not a medical device</p><span>Community Health Coordination · Rupandehi</span></footer>
    </div>
  )
}

function NetworkVisual() {
  const reduced = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([0])
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const atmosphereX = useMotionValue(0)
  const atmosphereY = useMotionValue(0)
  const networkX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.7 })
  const networkY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.7 })
  const lightX = useSpring(atmosphereX, { stiffness: 55, damping: 24, mass: 0.9 })
  const lightY = useSpring(atmosphereY, { stiffness: 55, damping: 24, mass: 0.9 })

  useEffect(() => {
    if (reduced) return
    const intervals = [2300, 2600, 2900, 2600, 2800, 3400]
    const timer = window.setTimeout(() => {
      setCompletedSteps((steps) => steps.includes(activeIndex) ? steps : [...steps, activeIndex])
      setActiveIndex((index) => (index + 1) % NETWORK_STEPS.length)
    }, intervals[activeIndex])
    return () => window.clearTimeout(timer)
  }, [activeIndex, reduced])

  function moveParallax(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    pointerX.set(horizontal * 5)
    pointerY.set(vertical * 4)
    atmosphereX.set(horizontal * -2)
    atmosphereY.set(vertical * -2)
  }

  function resetParallax() {
    pointerX.set(0)
    pointerY.set(0)
    atmosphereX.set(0)
    atmosphereY.set(0)
  }

  return (
    <div className="network-visual" onPointerMove={moveParallax} onPointerLeave={resetParallax}>
      <motion.div className="network-ambient" style={{ x: lightX, y: lightY }} aria-hidden="true" />
      <motion.div className="network-parallax" style={{ x: networkX, y: networkY }}>
        <svg className="network-lines" viewBox="0 0 600 500" fill="none" aria-hidden="true">
          {NETWORK_EDGES.map((edge, index) => (
            <motion.path
              key={edge.d}
              d={edge.d}
              stroke={activeIndex === index || activeIndex === index + 1 ? '#dfc17d' : 'rgba(184,225,212,.38)'}
              strokeWidth={activeIndex === index || activeIndex === index + 1 ? 1.8 : 1.25}
              strokeDasharray={activeIndex === index || activeIndex === index + 1 ? 'none' : '3 6'}
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: activeIndex === index || activeIndex === index + 1 ? 0.92 : completedSteps.includes(index) ? 0.54 : 0.26 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          ))}
          {!reduced && (
            <motion.circle
              r="3.4"
              fill="#f1cc7e"
              stroke="rgba(241,204,126,.22)"
              strokeWidth="5"
              initial={{ cx: 220, cy: 65, opacity: 0 }}
              animate={{ cx: [220, 220, 220, 220, 220, 220, 220, 220, 220, 220], cy: [65, 96, 146, 182, 232, 269, 319, 355, 405, 432], opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0] }}
              transition={{ duration: 14.2, ease: 'linear', repeat: Infinity, repeatDelay: 0.8 }}
            />
          )}
          {reduced && <circle cx="220" cy="65" r="3.4" fill="#f1cc7e" />}
        </svg>
        <div className="network-spine" aria-label={`Fictional case journey: ${NETWORK_STEPS[activeIndex].label}`}>
          {NETWORK_STEPS.map(({ key, label, detail, Icon, className }, index) => {
            const active = index === activeIndex
            const complete = completedSteps.includes(index) && !active
            return (
              <motion.div
                key={key}
                className={`network-node ${className} ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: active ? 1 : complete ? 0.76 : 0.58, y: 0, scale: active ? 1.035 : 1 }}
                transition={{ duration: 0.36, delay: reduced ? 0 : index * 0.055, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="network-node-icon"><Icon size={14} /></span>
                <span className="network-node-copy"><strong>{label}</strong><small>{detail}</small></span>
                <span className="network-step-state" aria-hidden="true">{complete ? <Check size={11} /> : active ? <i /> : <span>{`0${index + 1}`}</span>}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <motion.div className="network-float-card match-float" initial={reduced ? false : { opacity: 0, y: 8 }} animate={reduced ? undefined : { opacity: 1, y: [0, -3, 0] }} transition={reduced ? undefined : { opacity: { duration: 0.35, delay: 0.75 }, y: { duration: 6.2, repeat: Infinity, ease: 'easeInOut' } }}>
        <span className="float-card-mark"><Building2 size={13} /></span><span><strong>92 / 100</strong><small>Facility match</small></span><i />
      </motion.div>
      <motion.div className="network-float-card eta-float" initial={reduced ? false : { opacity: 0, y: 8 }} animate={reduced ? undefined : { opacity: 1, y: [0, 3, 0] }} transition={reduced ? undefined : { opacity: { duration: 0.35, delay: 0.95 }, y: { duration: 7.1, repeat: Infinity, ease: 'easeInOut' } }}>
        <span className="float-card-mark"><Ambulance size={13} /></span><span><strong>12 min</strong><small>Transport ETA</small></span><i />
      </motion.div>
      <motion.div className="network-float-card follow-float" initial={reduced ? false : { opacity: 0, y: 8 }} animate={reduced ? undefined : { opacity: 1, y: [0, -2, 0] }} transition={reduced ? undefined : { opacity: { duration: 0.35, delay: 1.15 }, y: { duration: 6.7, repeat: Infinity, ease: 'easeInOut' } }}>
        <span className="float-card-mark"><Check size={13} /></span><span><strong>FOLLOW-UP</strong><small>Scheduled</small></span><i />
      </motion.div>
      <div className="network-caption"><span className="network-caption-dot" /> CASE #1042 · {NETWORK_STEPS[activeIndex].label.toUpperCase()}</div>
    </div>
  )
}