import { Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useRef, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { layoutDiagram, topologyKey } from '../compiler/diagram.ts'
import { useCompiled } from '../store/worldStore.ts'

function FlowCanvas() {
  const compiled = useCompiled()
  const key = topologyKey(compiled)
  const { fitView } = useReactFlow()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void layoutDiagram(compiled).then((flow) => {
      if (cancelled) return
      setNodes(flow.nodes)
      setEdges(flow.edges)
      if (lastKey.current !== key) {
        lastKey.current = key
        requestAnimationFrame(() => {
          void fitView({ padding: 0.16 })
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [compiled, fitView, key])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnScroll
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#2a3340" gap={18} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export function DiagramPanel() {
  return (
    <div className="diagram-panel">
      <header>
        <h2>Compiled diagram</h2>
        <p>Live projection of the factory graph. Not a second editor.</p>
      </header>
      <div className="diagram-canvas">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
