import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fx } from './fx'

gsap.registerPlugin(ScrollTrigger)

/**
 * The scroll choreography, built as ONE master timeline mapped linearly onto
 * the full page scroll. A single timeline recomputes the entire state for any
 * scroll position, so fast jumps (nav clicks, scrollbar drags) stay
 * deterministic — per-section timelines would render in creation order and
 * leave stale values behind.
 *
 *   hero        -> can rotates, drifts toward camera (video backdrop behind)
 *   story       -> can parks at the side, spins as flavors swap
 *   ingredients -> can returns to center, rings + particles charge up
 *   brand       -> can fades out, content takes the stage
 *   reveal      -> can stays hidden, CTA finale
 */
export default function ScrollFX({ canRef }: { canRef: React.RefObject<THREE.Group> }) {
  const camera = useThree((s) => s.camera)

  useLayoutEffect(() => {
    const can = canRef.current
    if (!can) return

    let tl: gsap.core.Timeline | null = null

    const build = () => {
      tl?.scrollTrigger?.kill()
      tl?.kill()

      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const vh = window.innerHeight
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
      const topOf = (sel: string) => {
        const el = document.querySelector(sel)
        return el ? (el as HTMLElement).getBoundingClientRect().top + window.scrollY : 0
      }
      // normalized [0..1] position of a scroll offset within the page
      const f = (y: number) => Math.min(1, Math.max(0, y / maxScroll))

      const heroEnd = f(topOf('#story') - vh) // hero 'bottom bottom'
      const storyTop = f(topOf('#story'))
      const storyEnd = f(topOf('#ingredients') - vh)
      const ingTop = f(topOf('#ingredients'))
      const brandIn = f(topOf('#brand') - vh)
      const brandTop = f(topOf('#brand'))
      const revealIn = f(topOf('#reveal') - vh)
      const revealTop = f(topOf('#reveal'))

      // Side offsets shrink with the viewport so the can stays in its own lane.
      const xF = Math.min(1, window.innerWidth / 1440)
      const aspect = window.innerWidth / window.innerHeight
      const TURN = Math.PI * 2

      // hero: park the can left of the centered wordmark (RTL) so it never covers it
      const heroX = isMobile ? 0 : -Math.max(1.6, 1.45 * aspect)
      const heroY = isMobile ? 0.9 : 0.15

      const storyX = isMobile ? 0 : -1.65 * xF
      const storyY = isMobile ? 0.95 : -0.05
      const storyScale = isMobile ? 0.7 : 0.92
      const ingX = isMobile ? 0 : 1.45 * xF
      const ingY = isMobile ? 1.05 : -0.45
      const ingScale = isMobile ? 0.55 : 0.8
      const brandX = isMobile ? 0 : -2.6 * xF
      const brandY = isMobile ? 1.45 : 0.3
      const brandScale = isMobile ? 0.4 : 0.52
      const revealY = isMobile ? 0.95 : 0.85
      const revealScale = isMobile ? 0.6 : 0.8
      const camZ = (z: number) => (isMobile ? z + 1.05 : z)

      can.position.set(heroX, heroY, 0)
      can.rotation.set(0, 0, 0)
      can.scale.setScalar(isMobile ? 0.85 : 1)
      camera.position.set(0, 0, camZ(6))
      Object.assign(fx, { rings: 0, glow: 1, particleSize: 1, particleOpacity: 0.55, canFade: 1 })

      const seg = (t0: number, t1: number) => ({ duration: Math.max(0.0001, t1 - t0), ease: 'none' as const })

      tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { start: 0, end: 'max', scrub: 0.8, invalidateOnRefresh: false },
      })

      // ---- Section 1 · hero: one elegant turn while drifting up ----
      tl.to(can.rotation, { y: TURN, ...seg(0, heroEnd) }, 0)
        .to(can.position, { y: isMobile ? 1.15 : 0.35, z: 0.9, ...seg(0, heroEnd) }, 0)
        .to(fx, { glow: 0.85, ...seg(0, heroEnd) }, 0)

      // ---- into Section 2 · story: park beside the copy, label front ----
      tl.to(can.position, { x: storyX, y: storyY, z: 0.1, ...seg(heroEnd, storyTop) }, heroEnd)
        .to(can.scale, { x: storyScale, y: storyScale, z: storyScale, ...seg(heroEnd, storyTop) }, heroEnd)
        .to(fx, { glow: 0.55, particleOpacity: 0.35, ...seg(heroEnd, storyTop) }, heroEnd)
        .to(camera.position, { z: camZ(5.7), ...seg(heroEnd, storyTop) }, heroEnd)

      // ---- through story: subtle drift — flavor swaps do their own spins ----
      tl.to(can.rotation, { y: TURN + 0.85, ...seg(storyTop, storyEnd) }, storyTop)

      // ---- into Section 3 · ingredients: left lane, energy charges up ----
      tl.to(can.position, { x: ingX, y: ingY, z: -0.2, ...seg(storyEnd, ingTop) }, storyEnd)
        .to(can.scale, { x: ingScale, y: ingScale, z: ingScale, ...seg(storyEnd, ingTop) }, storyEnd)
        .to(can.rotation, { y: TURN * 3, ...seg(storyEnd, ingTop) }, storyEnd)
        .to(fx, { rings: 1, particleSize: 1.5, particleOpacity: 0.8, glow: 0.7, ...seg(storyEnd, ingTop) }, storyEnd)
        .to(camera.position, { z: camZ(6.3), ...seg(storyEnd, ingTop) }, storyEnd)

      // ---- into Section 4 · brand: right rail beside the media column ----
      tl.to(can.position, { x: brandX, y: brandY, z: -1.1, ...seg(brandIn, brandTop) }, brandIn)
        .to(can.scale, { x: brandScale, y: brandScale, z: brandScale, ...seg(brandIn, brandTop) }, brandIn)
        .to(can.rotation, { y: TURN * 4, ...seg(brandIn, brandTop) }, brandIn)
        .to(fx, { rings: 0, canFade: 0, particleSize: 1.2, particleOpacity: 0.45, ...seg(brandIn, brandTop) }, brandIn)
        .to(camera.position, { z: camZ(6), ...seg(brandIn, brandTop) }, brandIn)

      // ---- Section 5 · reveal: the can stays hidden — the CTA owns the finale ----
      tl.to(fx, { rings: 0, canFade: 0, particleSize: 1.6, particleOpacity: 0.8, ...seg(revealIn, revealTop) }, revealIn)
        .to(camera.position, { x: 0, z: camZ(5.35), ...seg(revealIn, revealTop) }, revealIn)

      // pad the timeline out to the true end of the page so time maps 1:1
      tl.set({}, {}, 1)
    }

    build()

    // Re-measure once everything (fonts, images) has loaded, and on resize.
    let resizeT: number | undefined
    const onResize = () => {
      window.clearTimeout(resizeT)
      resizeT = window.setTimeout(build, 200)
    }
    window.addEventListener('load', build)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('load', build)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeT)
      tl?.scrollTrigger?.kill()
      tl?.kill()
    }
  }, [camera, canRef])

  return null
}
