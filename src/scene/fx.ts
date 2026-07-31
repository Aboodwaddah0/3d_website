// Mutable FX values tweened by GSAP ScrollTriggers and read every frame by the
// scene components. This decouples scroll timelines from suspense-mounted meshes.
export const fx = {
  rings: 0,
  glow: 1,
  particleSize: 1,
  particleOpacity: 0.55,
  canFade: 1,
  screens: 0,
  camRotX: 0,
  camRotY: 0,
  fov: 42,
  hdrShift: 0,
  exposure: 1.05,
  trailIntensity: 0.4,
  floorOpacity: 0.35,
}
