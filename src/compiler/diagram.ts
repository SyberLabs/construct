import { Position, type Edge, type Node } from '@xyflow/react'
import ELK from 'elkjs/lib/elk.bundled.js'
import type { ElkNode } from 'elkjs'
import { CHANNEL_COLORS, specOf } from '../model/catalog.ts'
import type { CompiledSystem, PortSpec } from '../model/types.ts'

const NODE_W = 168
const NODE_H = 56
const elk = new ELK()

export function topologyKey(compiled: CompiledSystem): string {
  const nodes = compiled.nodes.map((node) => node.id).sort()
  const edges = compiled.edges
    .map(
      (edge) =>
        `${edge.id}:${edge.source}:${edge.target}:${edge.sourcePort}:${edge.targetPort}`,
    )
    .sort()
  return `${nodes.join(',')}|${edges.join(',')}`
}

function portSide(port: PortSpec): 'WEST' | 'EAST' {
  return port.direction === 'in' ? 'WEST' : 'EAST'
}

function flowNode(
  compiled: CompiledSystem,
  id: string,
  x: number,
  y: number,
): Node {
  const node = compiled.nodes.find((item) => item.id === id)
  if (!node) {
    return {
      id,
      position: { x, y },
      data: { label: id },
      draggable: false,
    }
  }
  const spec = specOf(node.kind)
  return {
    id: node.id,
    position: { x, y },
    data: {
      label: `${spec.short}  ${node.name}`,
      color: spec.color,
      kind: node.kind,
    },
    style: {
      width: NODE_W,
      border: `1px solid ${spec.color}`,
      background: '#141820',
      color: '#e8edf5',
      fontSize: 12,
      borderRadius: 6,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
    selectable: true,
  }
}

function flowEdges(compiled: CompiledSystem): Edge[] {
  return compiled.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.channel,
    style: { stroke: CHANNEL_COLORS[edge.channel], strokeWidth: 2 },
    labelStyle: { fill: CHANNEL_COLORS[edge.channel], fontSize: 10 },
    animated: edge.channel === 'async',
  }))
}

export async function layoutDiagram(compiled: CompiledSystem): Promise<{
  nodes: Node[]
  edges: Edge[]
}> {
  if (compiled.nodes.length === 0) {
    return { nodes: [], edges: [] }
  }

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
      'elk.spacing.nodeNode': '36',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: compiled.nodes.map((node) => {
      const spec = specOf(node.kind)
      return {
        id: node.id,
        width: NODE_W,
        height: NODE_H,
        layoutOptions: {
          'elk.portConstraints': 'FIXED_SIDE',
        },
        ports: spec.ports.map((port) => ({
          id: `${node.id}:${port.id}`,
          width: 8,
          height: 8,
          layoutOptions: {
            'elk.port.side': portSide(port),
          },
        })),
      }
    }),
    edges: compiled.edges.map((edge) => ({
      id: edge.id,
      sources: [`${edge.source}:${edge.sourcePort}`],
      targets: [`${edge.target}:${edge.targetPort}`],
    })),
  }

  const layout = await elk.layout(graph)
  const nodes: Node[] = (layout.children ?? []).map((child) =>
    flowNode(compiled, child.id, child.x ?? 0, child.y ?? 0),
  )

  return { nodes, edges: flowEdges(compiled) }
}
