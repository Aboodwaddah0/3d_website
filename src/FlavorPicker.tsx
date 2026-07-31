import { useEffect, useState } from 'react'
import { FLAVORS, sceneStore, type FlavorId } from './store'

export default function FlavorPicker() {
  const [active, setActive] = useState<FlavorId>(sceneStore.flavor)

  useEffect(() => {
    return sceneStore.subscribe(() => setActive(sceneStore.flavor))
  }, [])

  return (
    <div className="flavor-picker">
      {FLAVORS.map((f) => (
        <button
          key={f.id}
          className={`fp-dot${active === f.id ? ' fp-active' : ''}`}
          style={{ '--fp-accent': f.accent } as React.CSSProperties}
          onClick={() => sceneStore.setFlavor(f.id)}
          aria-label={f.name}
        >
          <span className="fp-ring" />
          <span className="fp-label">{f.name}</span>
        </button>
      ))}
    </div>
  )
}
