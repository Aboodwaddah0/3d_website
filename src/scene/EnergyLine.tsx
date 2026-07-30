import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PARTICLE_COUNT = 14
const NODE_FRACS = [0.08, 0.16, 0.26, 0.35, 0.44, 0.54, 0.64, 0.72, 0.82, 0.92]

function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const d = [`M${pts[0][0]} ${pts[0][1]}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const k = 1 / 6
    d.push(
      `C${p1[0] + (p2[0] - p0[0]) * k} ${p1[1] + (p2[1] - p0[1]) * k} ` +
      `${p2[0] - (p3[0] - p1[0]) * k} ${p2[1] - (p3[1] - p1[1]) * k} ` +
      `${p2[0]} ${p2[1]}`,
    )
  }
  return d.join(' ')
}

export default function EnergyLine() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const coreRef = useRef<SVGPathElement>(null)
  const glowRef = useRef<SVGPathElement>(null)
  const softRef = useRef<SVGPathElement>(null)
  const nodeEls = useRef<(SVGGElement | null)[]>([])
  const dotEls = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    const svg = svgRef.current
    const core = coreRef.current
    const glow = glowRef.current
    const soft = softRef.current
    if (!wrap || !svg || !core || !glow || !soft) return

    let len = 0
    const paths = [core, glow, soft]
    const nodeVis: boolean[] = NODE_FRACS.map(() => false)

    const layout = () => {
      const w = window.innerWidth
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
      )

      wrap.style.height = `${h}px`
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)

      const lg = svg.getElementById('el-lg')
      const gg = svg.getElementById('el-gg')
      if (lg) lg.setAttribute('y2', String(h))
      if (gg) gg.setAttribute('y2', String(h))

      const pts: [number, number][] = [
        [w * 0.50, 0],
        [w * 0.50, h * 0.03],
        [w * 0.75, h * 0.06],
        [w * 0.80, h * 0.10],
        [w * 0.18, h * 0.15],
        [w * 0.16, h * 0.20],
        [w * 0.22, h * 0.25],
        [w * 0.80, h * 0.30],
        [w * 0.84, h * 0.35],
        [w * 0.18, h * 0.40],
        [w * 0.16, h * 0.44],
        [w * 0.50, h * 0.48],
        [w * 0.28, h * 0.52],
        [w * 0.26, h * 0.56],
        [w * 0.74, h * 0.60],
        [w * 0.76, h * 0.64],
        [w * 0.50, h * 0.68],
        [w * 0.76, h * 0.72],
        [w * 0.26, h * 0.76],
        [w * 0.50, h * 0.80],
        [w * 0.52, h * 0.85],
        [w * 0.50, h * 0.90],
        [w * 0.48, h * 0.95],
        [w * 0.50, h],
      ]

      const d = smooth(pts)
      paths.forEach(p => p.setAttribute('d', d))
      len = core.getTotalLength()
      paths.forEach(p => {
        p.style.strokeDasharray = String(len)
        p.style.strokeDashoffset = String(len)
      })

      NODE_FRACS.forEach((f, i) => {
        const g = nodeEls.current[i]
        if (!g || !len) return
        const pt = core.getPointAtLength(len * f)
        gsap.set(g, { x: pt.x, y: pt.y, transformOrigin: '0 0' })
      })
    }

    // Run layout synchronously first so paths have data
    layout()

    // Init nodes hidden
    nodeEls.current.forEach(g => {
      if (g) gsap.set(g, { scale: 0, opacity: 0 })
    })

    // Now create GSAP animations (paths are ready)
    const ctx = gsap.context(() => {
      gsap.to(paths, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })

      nodeEls.current.forEach(g => {
        if (!g) return
        const ring = g.querySelector('.nr') as SVGCircleElement | null
        if (ring) {
          gsap.fromTo(
            ring,
            { attr: { r: 10 }, opacity: 0.5 },
            { attr: { r: 28 }, opacity: 0, duration: 2.5, repeat: -1, ease: 'power1.out' },
          )
        }
      })
    })

    // Re-measure after content fully renders (images, fonts, etc.)
    const remeasure = () => {
      layout()
      ScrollTrigger.refresh()
    }
    requestAnimationFrame(remeasure)
    setTimeout(remeasure, 500)
    setTimeout(remeasure, 1500)

    // Keep measuring when body resizes
    const ro = new ResizeObserver(remeasure)
    ro.observe(document.body)

    // Particles
    const pState = Array.from({ length: PARTICLE_COUNT }, () => ({
      t: Math.random(),
      speed: 0.06 + Math.random() * 0.18,
      r: 1 + Math.random() * 2,
    }))

    let prev = performance.now()
    let raf: number

    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.1)
      prev = now
      const maxS = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxS > 0 ? window.scrollY / maxS : 0

      pState.forEach((p, i) => {
        const el = dotEls.current[i]
        if (!el || !len) return
        p.t = (p.t + p.speed * dt) % 1
        const pos = p.t * progress
        if (pos < 0.002 || progress < 0.005) {
          el.setAttribute('opacity', '0')
          return
        }
        const pt = core.getPointAtLength(len * pos)
        el.setAttribute('cx', String(pt.x))
        el.setAttribute('cy', String(pt.y))
        el.setAttribute('r', String(p.r))
        const fade = Math.min(pos / 0.02, (progress - pos) / 0.02, 1)
        el.setAttribute('opacity', String(Math.max(0, fade * 0.7)))
      })

      NODE_FRACS.forEach((f, i) => {
        const g = nodeEls.current[i]
        if (!g) return
        const show = progress >= f - 0.005
        if (show && !nodeVis[i]) {
          nodeVis[i] = true
          gsap.to(g, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', overwrite: true })
        } else if (!show && nodeVis[i]) {
          nodeVis[i] = false
          gsap.to(g, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: true })
        }
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      layout()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      ctx.revert()
    }
  }, [])

  return (
    <div ref={wrapRef} className="energy-line-wrap">
      <svg ref={svgRef} className="energy-svg">
        <defs>
          <linearGradient id="el-lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="10000">
            <stop offset="0%" stopColor="#f5c84c" />
            <stop offset="30%" stopColor="#f5c84c" />
            <stop offset="52%" stopColor="#b97bff" />
            <stop offset="72%" stopColor="#6be2ff" />
            <stop offset="88%" stopColor="#f5c84c" />
            <stop offset="100%" stopColor="#b98f2e" />
          </linearGradient>
          <linearGradient id="el-gg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="10000">
            <stop offset="0%" stopColor="#f5c84c" stopOpacity="0.18" />
            <stop offset="52%" stopColor="#b97bff" stopOpacity="0.12" />
            <stop offset="72%" stopColor="#6be2ff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f5c84c" stopOpacity="0.08" />
          </linearGradient>
          <filter id="el-f1" x="-40%" y="-1%" width="180%" height="102%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
          </filter>
          <filter id="el-f2" x="-40%" y="-1%" width="180%" height="102%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <filter id="el-fd" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        <path ref={softRef} fill="none" stroke="url(#el-gg)" strokeWidth="22" strokeLinecap="round" filter="url(#el-f1)" />
        <path ref={glowRef} fill="none" stroke="url(#el-gg)" strokeWidth="5" strokeLinecap="round" filter="url(#el-f2)" />
        <path ref={coreRef} fill="none" stroke="url(#el-lg)" strokeWidth="1.5" strokeLinecap="round" />

        {NODE_FRACS.map((_, i) => (
          <g key={i} ref={el => { nodeEls.current[i] = el }}>
            <circle className="nr" r="10" fill="none" stroke="#f5c84c" strokeWidth="1" />
            <circle r="3.5" fill="#f5c84c" />
          </g>
        ))}

        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <circle key={i} ref={el => { dotEls.current[i] = el }} r="2" fill="#fffbe6" opacity="0" filter="url(#el-fd)" />
        ))}
      </svg>
    </div>
  )
}
