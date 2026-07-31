import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Experience from './scene/Experience'
import EnergyLine from './scene/EnergyLine'
import FlavorPicker from './FlavorPicker'
import { FLAVORS, sceneStore, type FlavorId } from './store'

gsap.registerPlugin(ScrollTrigger)

const INGREDIENTS = [
  { num: '٠١', name: 'كافيين طبيعي', desc: '٢٠٠ ملغ من الكافيين المستخلص من حبوب البن الخضراء، يمنح يقظة تدوم حتى ٦ ساعات.' },
  { num: '٠٢', name: 'غوارانا وجنسنغ', desc: 'الغوارانا يطلق الكافيين تدريجياً، والجنسنغ يدعم التحمّل البدني والذهني.' },
  { num: '٠٣', name: 'فيتامين ب المركب', desc: 'ب٦ وب١٢ يساعدان الجسم على تحويل الغذاء إلى طاقة ودعم وظائف الجهاز العصبي.' },
  { num: '٠٤', name: 'خالٍ من السكر', desc: 'محلّى بالسكرالوز — صفر سعرات من السكر، مع الحفاظ على الطعم الكامل.' },
]

function splitWords(selector: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach(el => {
    if (el.dataset.split) return
    el.dataset.split = '1'
    const parts = el.innerHTML.split(/(<br\s*\/?>)/gi)
    el.innerHTML = ''
    parts.forEach(part => {
      if (/<br\s*\/?>/i.test(part)) {
        el.appendChild(document.createElement('br'))
      } else {
        const words = part.split(/(\s+)/)
        words.forEach(w => {
          if (!w) return
          const span = document.createElement('span')
          span.className = 'split-ch'
          span.style.display = 'inline-block'
          span.textContent = w
          if (/^\s+$/.test(w)) span.style.whiteSpace = 'pre'
          el.appendChild(span)
        })
      }
    })
  })
}

let preloaderDone = false

export default function App() {
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const introFired = useRef(false)

  const triggerIntro = useCallback(() => {
    if (introFired.current) return
    introFired.current = true
    gsap.fromTo(
      '.hero-title .ch',
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.07, delay: 0.1 },
    )
    gsap.fromTo(
      '.hero-tag, .hero-scroll-hint',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.15, delay: 0.6 },
    )
    gsap.fromTo('.nav', { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.1 })
  }, [])

  useEffect(() => {
    if (preloaderDone) { triggerIntro(); return }
    const onDone = () => { preloaderDone = true; triggerIntro() }
    if (!document.getElementById('preloader')) { onDone(); return }
    window.addEventListener('preloader-done', onDone, { once: true })
    return () => { window.removeEventListener('preloader-done', onDone) }
  }, [triggerIntro])

  useEffect(() => {
    splitWords('.story .headline, .ingredients .headline, .brand .headline')

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      gsap.to('.hero-inner', {
        opacity: 0,
        yPercent: -18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '28% top', end: '75% top', scrub: true },
      })

      gsap.to('.hero-video-wrap', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '#story', start: 'top 90%', end: 'top 25%', scrub: true },
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 70 },
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
          },
        )
      })

      document.querySelectorAll<HTMLElement>('.headline[data-split]').forEach(el => {
        const chars = el.querySelectorAll('.split-ch')
        gsap.fromTo(
          chars,
          { opacity: 0, y: 60, rotateX: -90, transformOrigin: 'center bottom' },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.025,
            scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('.flavor-block').forEach((block) => {
        const flavor = Number(block.dataset.flavor) as FlavorId
        ScrollTrigger.create({
          trigger: block,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => sceneStore.setFlavor(flavor),
          onEnterBack: () => sceneStore.setFlavor(flavor),
        })
        const card = block.querySelector('.flavor-card')
        if (card) {
          gsap.fromTo(
            card,
            { y: 120, rotate: -4 },
            {
              y: -60,
              rotate: 3,
              ease: 'none',
              scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
      })

      ScrollTrigger.create({
        trigger: '#story',
        start: 'top 70%',
        end: 'bottom 30%',
        onEnter: () => document.querySelector('.flavor-picker')?.classList.add('fp-visible'),
        onLeave: () => document.querySelector('.flavor-picker')?.classList.remove('fp-visible'),
        onEnterBack: () => document.querySelector('.flavor-picker')?.classList.add('fp-visible'),
        onLeaveBack: () => document.querySelector('.flavor-picker')?.classList.remove('fp-visible'),
      })

      gsap.fromTo(
        '.brand-video-frame',
        { scale: 0.72, opacity: 0.4, borderRadius: 48 },
        {
          scale: 1,
          opacity: 1,
          borderRadius: 24,
          ease: 'none',
          scrollTrigger: { trigger: '.brand-video-frame', start: 'top 95%', end: 'top 30%', scrub: true },
        },
      )

      gsap.utils.toArray<HTMLElement>('.brand-card img').forEach((img, i) => {
        gsap.fromTo(
          img,
          { yPercent: i % 2 ? 6 : -6 },
          {
            yPercent: i % 2 ? -6 : 6,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })

      const revealTl = gsap.timeline({
        scrollTrigger: { trigger: '.reveal', start: '30% bottom', end: '70% bottom', scrub: true },
      })
      revealTl
        .fromTo('.reveal-title', { opacity: 0, y: 90, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, ease: 'none' })
        .fromTo('.reveal-sub, .reveal-cta', { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: 'none', stagger: 0.12 }, '<0.25')
    })

    const handlers = new Map<HTMLElement, { move: (e: MouseEvent) => void; leave: () => void }>()
    document.querySelectorAll<HTMLElement>('.magnetic').forEach(btn => {
      const move = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        gsap.to(btn, { x: dx * 0.35, y: dy * 0.35, duration: 0.3, ease: 'power2.out' })
      }
      const leave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
      }
      btn.addEventListener('mousemove', move)
      btn.addEventListener('mouseleave', leave)
      handlers.set(btn, { move, leave })
    })

    heroVideoRef.current?.play().catch(() => {})

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
      handlers.forEach(({ move, leave }, btn) => {
        btn.removeEventListener('mousemove', move)
        btn.removeEventListener('mouseleave', leave)
      })
    }
  }, [])

  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector)
    if (el) window.scrollTo({ top: (el as HTMLElement).offsetTop, behavior: 'smooth' })
  }

  return (
    <>
      <div className="hero-video-wrap">
        <video ref={heroVideoRef} src="/assets/hero.mp4" muted loop playsInline autoPlay preload="auto" />
      </div>

      <div className="canvas-wrap">
        <Experience />
      </div>

      <nav className="nav">
        <a className="nav-logo" href="#" onClick={(e) => { e.preventDefault(); scrollTo('.hero') }}>
          <span className="crown">♛</span><span>Bos<b>S</b></span>
        </a>
        <button className="nav-cta magnetic" onClick={() => scrollTo('.reveal')}>احصل على BosS</button>
      </nav>

      <FlavorPicker />

      <main>
        <EnergyLine />

        <section className="hero" id="hero">
          <div className="hero-inner">
            <h1 className="hero-title" aria-label="BosS">
              {['B', 'o', 's', 'S'].map((c, i) => (
                <span className="ch" key={i}>{c}</span>
              ))}
            </h1>
            <p className="hero-tag">أطلق قوتك</p>
            <div className="hero-scroll-hint">مرّر</div>
          </div>
        </section>

        <section className="story" id="story">
          <div className="story-head">
            <p className="kicker" data-reveal>المجموعة</p>
            <h2 className="headline">ثلاث نكهات.<br />تركيبة واحدة.</h2>
            <p className="body-copy" data-reveal style={{ marginTop: 26 }}>
              كل علبة BosS تحتوي على ٢٠٠ ملغ كافيين طبيعي، فيتامينات ب المركبة،
              وخالية من السكر — مصممة لتمنحك طاقة مستمرة بدون انهيار.
            </p>
          </div>

          {FLAVORS.map((f, i) => (
            <div className="flavor-block" data-flavor={f.id} id={`flavor-${f.id}`} key={f.id}>
              <div className="flavor-copy">
                <p className="flavor-index" data-reveal>{String(i + 1).padStart(2, '0')} / 03</p>
                <h3 className="flavor-name" data-reveal style={{ color: f.accent }}>{f.name}</h3>
                <p className="flavor-sub" data-reveal>{f.sub}</p>
                <p className="flavor-tagline" data-reveal>{f.tag}. ٢٥٠ مل.</p>
                <div className="flavor-card">
                  <img src={f.texture} alt={`BosS ${f.name} can`} loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="ingredients" id="ingredients">
          <div className="ingredients-head">
            <p className="kicker" data-reveal>داخل العلبة</p>
            <h2 className="headline">طاقة<br />مهندسة</h2>
            <p className="body-copy" data-reveal style={{ margin: '26px auto 0' }}>
              مكونات مختارة لدعم الأداء الذهني والبدني — كافيين طبيعي،
              غوارانا، جنسنغ، وفيتامينات ب، بدون سكر مضاف.
            </p>
          </div>
          <div className="ing-grid">
            {INGREDIENTS.map((ing) => (
              <div className="ing-item" data-reveal key={ing.num}>
                <span className="num">{ing.num}</span>
                <h3>{ing.name}</h3>
                <p>{ing.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="brand" id="brand">
          <div className="brand-head">
            <p className="kicker" data-reveal>التجربة</p>
            <h2 className="headline">امتلك<br />الليل</h2>
          </div>

          <div className="brand-video-frame">
            <video src="/assets/hero.mp4" muted loop playsInline autoPlay preload="none" />
            <span className="frame-label">BosS — الكشف السينمائي</span>
          </div>

          <div className="brand-gallery">
            <div className="brand-card" data-reveal>
              <img src="/assets/scene-club.jpg" alt="BosS ألترا فوكس في النادي" loading="lazy" />
              <span className="card-caption">ألترا فوكس · بعد منتصف الليل</span>
            </div>
            <div className="brand-card" data-reveal>
              <img src="/assets/scene-trio.jpg" alt="تشكيلة مجموعة BosS" loading="lazy" />
              <span className="card-caption">التشكيلة الكاملة</span>
            </div>
          </div>
        </section>

        <section className="reveal" id="reveal">
          <div className="reveal-sticky">
            <h2 className="reveal-title">
              <span className="gold">BosS</span> — طاقتك<br />تبدأ هنا
            </h2>
            <p className="reveal-sub">٢٠٠ ملغ كافيين · خالٍ من السكر · ثلاث نكهات · ٢٥٠ مل</p>
            <button className="reveal-cta magnetic" onClick={() => scrollTo('.hero')}>اعثر على نكهتك</button>
          </div>
        </section>
      </main>

      <footer>
        <span className="foot-logo">♛ Bos<b>S</b></span>
        <span>طاقة فاخرة — أطلق قوتك</span>
        <span>© ٢٠٢٦ شركة BosS للطاقة</span>
      </footer>
    </>
  )
}
