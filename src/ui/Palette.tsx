import { CHANNEL_COLORS, MACHINE_CATALOG, MACHINE_KINDS } from '../model/catalog.ts'
import { useWorldStore } from '../store/worldStore.ts'

export function Palette() {
  const stamp = useWorldStore((state) => state.stamp)
  const setStamp = useWorldStore((state) => state.setStamp)

  return (
    <div className="palette">
      <h2>Machines</h2>
      <button
        type="button"
        className={!stamp ? 'active' : undefined}
        onClick={() => setStamp(null)}
      >
        Select
      </button>
      {MACHINE_KINDS.map((kind) => {
        const spec = MACHINE_CATALOG[kind]
        const active = stamp === kind
        return (
          <button
            key={kind}
            type="button"
            className={active ? 'active' : undefined}
            onClick={() => setStamp(kind)}
            style={{ ['--kind' as string]: spec.color }}
          >
            <i style={{ background: spec.color }} />
            <span>
              <strong>{spec.label}</strong>
              {spec.description}
            </span>
          </button>
        )
      })}
      <h2>Pipes</h2>
      <ul className="legend">
        <li>
          <i style={{ background: CHANNEL_COLORS.request }} /> request
        </li>
        <li>
          <i style={{ background: CHANNEL_COLORS.async }} /> async
        </li>
        <li>
          <i style={{ background: CHANNEL_COLORS.data }} /> data
        </li>
      </ul>
      <p className="hint">
        Click a grid cell to stamp. Click an output port, then an input port, to
        connect. Click a pipe to select it. Shift-click adds to the selection.{' '}
        <kbd>R</kbd> rotate, <kbd>Del</kbd> delete, <kbd>Ctrl+Z</kbd> undo,
        <kbd>Esc</kbd> cancel.
      </p>
    </div>
  )
}
