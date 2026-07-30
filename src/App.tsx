import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Experience from './scene/Experience'
import { FLAVORS, sceneStore, type FlavorId } from './store'

gsap.registerPlugin(ScrollTrigger)

const INGREDIENTS = [
  { num: '٠١', name: 'كافيين طبيعي', desc: 'طاقة نظيفة من مصادر نباتية. تركيز حاد بدون انهيار — مصمم لجلسات طويلة.' },
  { num: '٠٢', name: 'غوارانا وجنسنغ', desc: 'منحنى طاقة بطيء الاحتراق من تركيبة ميدنايت بيري. تحمّل مُضاعف.' },
  { num: '٠٣', name: 'فيتامين ب المركب', desc: 'ب٦ وب١٢ يحركان أيض الطاقة الطبيعي، يحولان الوقود إلى زخم صافٍ.' },
  { num: '٠٤', name: 'خالٍ من السكر', desc: 'تركيبة أداء. نكهة كاملة، بدون تنازل — قوة لا تثقل عليك أبداً.' },
]

export default function App() {
  const heroVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // ----- hero intro (plays on load) -----
      gsap.fromTo(
        '.hero-title .ch',
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.07, delay: 0.35 },
      )
      gsap.fromTo(
        '.hero-tag, .hero-scroll-hint',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.15, delay: 1.1 },
      )
      gsap.fromTo('.nav', { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 })

      // ----- hero text parallax out on scroll -----
      gsap.to('.hero-inner', {
        opacity: 0,
        yPercent: -18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '28% top', end: '75% top', scrub: true },
      })

      // ----- fixed hero video fades away as the story begins -----
      gsap.to('.hero-video-wrap', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '#story', start: 'top 90%', end: 'top 25%', scrub: true },
      })

      // ----- generic text reveals -----
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

      // ----- flavor blocks: parallax card + flavor switching for the 3D can -----
      gsap.utils.toArray<HTMLElement>('.flavor-block').forEach((block) => {
        const flavor = Number(block.dataset.flavor) as FlavorId
        // fire early (as the block enters the viewport) so the can has already
        // swapped by the time the copy is in front of the reader
        ScrollTrigger.create({
          trigger: block,
          start: 'top 75%',
          end: 'bottom 75%',
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

      // ----- brand video: Apple-style scale up -----
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

      // ----- brand gallery parallax -----
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

      // ----- final reveal text -----
      const revealTl = gsap.timeline({
        scrollTrigger: { trigger: '.reveal', start: '30% bottom', end: '70% bottom', scrub: true },
      })
      revealTl
        .fromTo('.reveal-title', { opacity: 0, y: 90, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, ease: 'none' })
        .fromTo('.reveal-sub, .reveal-cta', { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: 'none', stagger: 0.12 }, '<0.25')
    })

    // Lazy-play the hero video once it can render frames.
    heroVideoRef.current?.play().catch(() => {})

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector)
    if (el) window.scrollTo({ top: (el as HTMLElement).offsetTop, behavior: 'smooth' })
  }

  return (
    <>
      {/* Fixed cinematic video backdrop (Section 1) */}
      <div className="hero-video-wrap">
        <video ref={heroVideoRef} src="/assets/hero.mp4" muted loop playsInline autoPlay preload="auto" />
      </div>

      {/* Fixed WebGL layer — the BosS can lives here across every section */}
      <div className="canvas-wrap">
        <Experience />
      </div>

      <nav className="nav">
        <a className="nav-logo" href="#" onClick={(e) => { e.preventDefault(); scrollTo('.hero') }}>
          <span className="crown">♛</span>Bos<b>S</b>
        </a>
        <button className="nav-cta" onClick={() => scrollTo('.reveal')}>احصل على BosS</button>
      </nav>

      <main>
        {/* -------- Section 1 · Hero -------- */}
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

        {/* -------- Section 2 · Product story -------- */}
        <section className="story" id="story">
          <div className="story-head">
            <p className="kicker" data-reveal>المجموعة</p>
            <h2 className="headline" data-reveal>ثلاثة تيجان.<br />عرش واحد.</h2>
            <p className="body-copy" data-reveal style={{ marginTop: 26 }}>
              كل علبة BosS مصممة كمنتج رائد — تركيبة فاخرة، نكهة دقيقة،
              ولمسة نهائية تملك المكان قبل أن تفتحها.
            </p>
          </div>

          {FLAVORS.map((f, i) => (
            <div className="flavor-block" data-flavor={f.id} id={`flavor-${f.id}`} key={f.id}>
              <div className="flavor-copy">
                <p className="flavor-index" data-reveal>{String(i + 1).padStart(2, '0')} / 03</p>
                <h3 className="flavor-name" data-reveal style={{ color: f.accent }}>{f.name}</h3>
                <p className="flavor-sub" data-reveal>{f.sub}</p>
                <p className="flavor-tagline" data-reveal>{f.tag}. ٢٥٠ مل من النية الصافية.</p>
                <div className="flavor-card">
                  <img src={f.texture} alt={`BosS ${f.name} can`} loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* -------- Section 3 · Ingredients & energy -------- */}
        <section className="ingredients" id="ingredients">
          <div className="ingredients-head">
            <p className="kicker" data-reveal>داخل العلبة</p>
            <h2 className="headline" data-reveal>طاقة<br />مهندسة</h2>
            <p className="body-copy" data-reveal style={{ margin: '26px auto 0' }}>
              تركيبة أداء مبنية حول تحفيز نظيف — شاهد الشحنة تتراكم
              حول العلبة أثناء التمرير.
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

        {/* -------- Section 4 · Brand experience -------- */}
        <section className="brand" id="brand">
          <div className="brand-head">
            <p className="kicker" data-reveal>التجربة</p>
            <h2 className="headline" data-reveal>امتلك<br />الليل</h2>
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

        {/* -------- Section 5 · Final reveal -------- */}
        <section className="reveal" id="reveal">
          <div className="reveal-sticky">
            <h2 className="reveal-title">
              <span className="gold">BosS</span> — شحن<br />لحظتك
            </h2>
            <p className="reveal-sub">طاقة فاخرة · خالٍ من السكر · ثلاث نكهات</p>
            <button className="reveal-cta" onClick={() => scrollTo('.hero')}>اعثر على نكهتك</button>
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
