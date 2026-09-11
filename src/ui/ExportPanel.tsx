import { useState } from 'react'
import { useCompiled } from '../store/worldStore.ts'
import { downloadText } from './download.ts'

type Format = 'mermaid' | 'structurizr'

export function ExportPanel() {
  const compiled = useCompiled()
  const [format, setFormat] = useState<Format>('mermaid')
  const [copied, setCopied] = useState(false)
  const text = format === 'mermaid' ? compiled.mermaid : compiled.structurizr
  const filename = format === 'mermaid' ? 'system.mmd' : 'workspace.dsl'

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="mermaid-panel">
      <header>
        <h2>Export</h2>
        <div className="row">
          <button
            type="button"
            className={format === 'mermaid' ? 'active' : undefined}
            onClick={() => setFormat('mermaid')}
          >
            Mermaid
          </button>
          <button
            type="button"
            className={format === 'structurizr' ? 'active' : undefined}
            onClick={() => setFormat('structurizr')}
          >
            Structurizr
          </button>
          <button type="button" onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={() => downloadText(filename, text, 'text/plain')}>
            Download
          </button>
        </div>
      </header>
      <pre>{text}</pre>
    </div>
  )
}
