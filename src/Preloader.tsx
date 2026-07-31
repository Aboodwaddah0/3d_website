import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = ref.current
    if (!wrap) return
    const bar = wrap.querySelector('.preloader-bar-fill') as HTMLElement
    const pct = wrap.querySelector('.preloader-pct') as HTMLElement
    const logo = wrap.querySelector('.preloader-logo') as HTMLElement
    const sub = wrap.querySelector('.preloader-sub') as HTMLElement
    const barWrap = bar.parentElement!
    const progress = { val: 0 }

    gsap.killTweensOf([wrap, logo, sub, barWrap, pct])

    const tl = gsap.timeline()
    tl.to(progress, {
      val: 100,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(progress.val)
        bar.style.transform = `scaleX(${v / 100})`
        pct.textContent = `${v}%`
      },
    })
    .to(logo, { scale: 1.15, duration: 0.4, ease: 'power2.in' }, '+=0.5')
    .to(sub, { opacity: 0, y: -10, duration: 0.3 }, '<0.1')
    .to([barWrap, pct], { opacity: 0, duration: 0.25 }, '<0.1')
    .to(wrap, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.inOut',
      onStart: onComplete,
      onComplete() { wrap.style.display = 'none' },
    })

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div ref={ref} className="preloader">
      <div className="preloader-content">
        <div className="preloader-logo">
          <span className="preloader-crown">♛</span>
          <span className="preloader-brand">Bos<b>S</b></span>
        </div>
        <p className="preloader-sub">PREMIUM ENERGY</p>
        <div className="preloader-bar">
          <div className="preloader-bar-fill" />
        </div>
        <p className="preloader-pct">0%</p>
      </div>
    </div>
  )
}
