import { specOf } from '../model/catalog.ts'
import type { GraphEdge, GraphNode } from '../model/types.ts'

function mermaidId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, '_')
}

export function toMermaid(nodes: GraphNode[], edges: GraphEdge[]): string {
  const lines = ['flowchart LR']
  if (nodes.length === 0) {
    lines.push('  empty["Empty factory"]')
    return `${lines.join('\n')}\n`
  }
  for (const node of nodes) {
    const spec = specOf(node.kind)
    const label = `${spec.short}: ${node.name}`.replaceAll('"', "'")
    lines.push(`  ${mermaidId(node.id)}["${label}"]`)
  }
  for (const edge of edges) {
    lines.push(
      `  ${mermaidId(edge.source)} -->|${edge.channel}| ${mermaidId(edge.target)}`,
    )
  }
  return `${lines.join('\n')}\n`
}
