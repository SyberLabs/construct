import { useEffect, useRef, useState } from 'react'
import { parseWorldDocument, serializeWorld } from '../io/worldJson.ts'
import { useWorldStore } from '../store/worldStore.ts'
import { downloadText } from './download.ts'

export function FileBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const undo = useWorldStore((state) => state.undo)
  const redo = useWorldStore((state) => state.redo)
  const canUndo = useWorldStore((state) => state.history.past.length > 0)
  const canRedo = useWorldStore((state) => state.history.future.length > 0)
  const loadSample = useWorldStore((state) => state.loadSample)
  const loadWorld = useWorldStore((state) => state.loadWorld)
  const frameBuild = useWorldStore((state) => state.frameBuild)
  const clear = useWorldStore((state) => state.clear)
  const documentName = useWorldStore((state) => state.documentName)
  const setDocumentMeta = useWorldStore((state) => state.setDocumentMeta)
  const [nameDraft, setNameDraft] = useState(documentName)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setNameDraft(documentName)
  }, [documentName])

  function save() {
    const state = useWorldStore.getState()
    const json = serializeWorld(state.world, {
      name: state.documentName || undefined,
      description: state.documentDescription || undefined,
    })
    downloadText('constructs-world.json', json, 'application/json')
    setError(null)
    setStatus('Saved constructs-world.json')
  }

  async function onFile(file: File) {
    const text = await file.text()
    const parsed = parseWorldDocument(text)
    if (!parsed.ok) {
      setStatus(null)
      setError(parsed.error)
      return
    }
    loadWorld(parsed.world, { name: parsed.name, description: parsed.description })
    const machines = Object.keys(parsed.world.machines).length
    const pipes = Object.keys(parsed.world.pipes).length
    setError(null)
    setStatus(`Loaded ${machines} machine${machines === 1 ? '' : 's'}, ${pipes} pipe${pipes === 1 ? '' : 's'}`)
  }

  return (
    <div className="topbar-actions">
      <input
        type="text"
        value={nameDraft}
        placeholder="World name"
        aria-label="World name"
        onChange={(event) => setNameDraft(event.target.value)}
        onBlur={() => setDocumentMeta({ name: nameDraft })}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        Redo
      </button>
      <button type="button" onClick={loadSample}>
        Load sample
      </button>
      <button type="button" onClick={frameBuild} title="Frame the occupied machines">
        Frame build
      </button>
      <button type="button" onClick={save}>
        Save JSON
      </button>
      <button type="button" onClick={() => inputRef.current?.click()}>
        Open JSON
      </button>
      <button type="button" onClick={clear}>
        Clear
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void onFile(file)
        }}
      />
      {error ? <span className="error">{error}</span> : null}
      {status && !error ? <span className="ok">{status}</span> : null}
    </div>
  )
}
