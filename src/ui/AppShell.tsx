import { useEffect } from 'react'
import { DiagramPanel } from '../diagram/DiagramPanel.tsx'
import { readAutosave, writeAutosave } from '../io/autosave.ts'
import { serializeWorld } from '../io/worldJson.ts'
import { WorldCanvas } from '../scene/WorldCanvas.tsx'
import { useWorldStore } from '../store/worldStore.ts'
import { Diagnostics } from './Diagnostics.tsx'
import { ExportPanel } from './ExportPanel.tsx'
import { FileBar } from './FileBar.tsx'
import { Inspector } from './Inspector.tsx'
import { Palette } from './Palette.tsx'

function useFactoryHotkeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }
      const store = useWorldStore.getState()
      const modified = event.ctrlKey || event.metaKey
      if (modified && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.redo()
        else store.undo()
        return
      }
      if (modified && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        store.redo()
        return
      }
      if (event.key === 'r' || event.key === 'R') store.rotateSelected()
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        store.deleteSelected()
      }
      if (event.key === 'Escape') store.cancelPending()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

function useAutosave() {
  useEffect(() => {
    const unsub = useWorldStore.subscribe((state, prev) => {
      if (
        state.world === prev.world &&
        state.documentName === prev.documentName &&
        state.documentDescription === prev.documentDescription
      ) {
        return
      }
      writeAutosave(
        serializeWorld(state.world, {
          name: state.documentName || undefined,
          description: state.documentDescription || undefined,
        }),
      )
    })
    const saved = readAutosave()
    if (saved?.ok) {
      const current = useWorldStore.getState()
      if (
        Object.keys(current.world.machines).length === 0 &&
        Object.keys(current.world.pipes).length === 0
      ) {
        current.loadWorld(saved.world, {
          name: saved.name,
          description: saved.description,
        })
      }
    }
    return unsub
  }, [])
}

export function AppShell() {
  useFactoryHotkeys()
  useAutosave()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <strong>Constructs</strong>
          <span>V0.3 · factory → diagram compiler</span>
        </div>
        <FileBar />
      </header>
      <Palette />
      <main className="viewport">
        <WorldCanvas />
      </main>
      <aside className="sidebar">
        <Inspector />
        <Diagnostics />
        <DiagramPanel />
        <ExportPanel />
      </aside>
    </div>
  )
}
