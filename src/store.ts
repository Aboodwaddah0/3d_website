// Tiny observable store shared between DOM scroll triggers and the 3D scene.
type Listener = () => void

export type FlavorId = 0 | 1 | 2

export const FLAVORS = [
  {
    id: 0 as FlavorId,
    name: 'ألترا فوكس',
    sub: 'طاقة فاخرة',
    tag: 'خالٍ من السكر — تركيبة أداء',
    accent: '#f5c84c',
    texture: '/assets/can-focus.jpg',
  },
  {
    id: 1 as FlavorId,
    name: 'تروبيكال سيتروس',
    sub: 'انتعاش منعش',
    tag: 'كافيين طبيعي — فيتامين ب المركب',
    accent: '#ffe36b',
    texture: '/assets/can-citrus.jpg',
  },
  {
    id: 2 as FlavorId,
    name: 'ميدنايت بيري',
    sub: 'نكهة جريئة',
    tag: 'غوارانا وجنسنغ — مضادات أكسدة',
    accent: '#b97bff',
    texture: '/assets/can-berry.jpg',
  },
]

const state = {
  flavor: 0 as FlavorId,
}

const listeners = new Set<Listener>()

export const sceneStore = {
  get flavor() {
    return state.flavor
  },
  setFlavor(f: FlavorId) {
    if (state.flavor === f) return
    state.flavor = f
    listeners.forEach((l) => l())
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
