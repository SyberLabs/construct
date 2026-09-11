import { specOf } from '../model/catalog.ts'
import type { ChannelKind, GraphEdge, GraphNode, World } from '../model/types.ts'

const CHANNEL_TECH: Record<ChannelKind, string> = {
  request: 'HTTP/RPC',
  async: 'async messaging',
  data: 'data access',
}

const RESERVED = new Set([
  'factory',
  'workspace',
  'model',
  'views',
  'container',
  'softwareSystem',
  'this',
])

export function toStructurizrDsl(
  world: World,
  nodes: GraphNode[],
  edges: GraphEdge[],
): string {
  const ids = uniqueIds(nodes.map((node) => node.id))
  const lines: string[] = [
    'workspace "Constructs" "Compiled from a Constructs factory." {',
    '    !identifiers flat',
    '    model {',
    '        factory = softwareSystem "Constructed system" "System compiled from the 3D factory." {',
  ]

  if (nodes.length === 0) {
    lines.push('            description "Empty factory"')
  }

  for (const node of nodes) {
    const spec = specOf(node.kind)
    const ident = ids.get(node.id) ?? dslIdent(node.id)
    const machine = world.machines[node.id]
    lines.push(
      `            ${ident} = container ${q(node.name)} ${q(spec.description)} ${q(spec.label)} {`,
      `                tags ${q(node.kind)}`,
      '                properties {',
      `                    "constructs.id" ${q(node.id)}`,
      `                    "constructs.kind" ${q(node.kind)}`,
    )
    if (machine) {
      lines.push(
        `                    "constructs.x" ${q(String(machine.position.x))}`,
        `                    "constructs.y" ${q(String(machine.position.y))}`,
        `                    "constructs.z" ${q(String(machine.position.z))}`,
        `                    "constructs.rotation" ${q(String(machine.rotation))}`,
      )
    }
    lines.push('                }', '            }')
  }

  lines.push('        }')

  for (const edge of edges) {
    const source = ids.get(edge.source)
    const target = ids.get(edge.target)
    if (!source || !target) continue
    lines.push(
      `        ${source} -> ${target} ${q(edge.channel)} ${q(CHANNEL_TECH[edge.channel])} {`,
      `            tags ${q(edge.channel)}`,
      '            properties {',
      `                "constructs.pipeId" ${q(edge.id)}`,
      `                "constructs.channel" ${q(edge.channel)}`,
      `                "constructs.fromPort" ${q(edge.sourcePort)}`,
      `                "constructs.toPort" ${q(edge.targetPort)}`,
      '            }',
      '        }',
    )
  }

  lines.push(
    '    }',
    '    views {',
    '        container factory "containers" {',
    '            include *',
    '            autoLayout lr',
    '        }',
    '    }',
    '}',
    '',
  )
  return lines.join('\n')
}

function uniqueIds(rawIds: string[]): Map<string, string> {
  const used = new Set<string>(RESERVED)
  const map = new Map<string, string>()
  for (const raw of rawIds) {
    let ident = dslIdent(raw)
    if (used.has(ident)) {
      let n = 2
      while (used.has(`${ident}_${n}`)) n += 1
      ident = `${ident}_${n}`
    }
    used.add(ident)
    map.set(raw, ident)
  }
  return map
}

function dslIdent(raw: string): string {
  let ident = raw.replace(/[^A-Za-z0-9_]/g, '_')
  if (!ident || /^[0-9]/.test(ident)) ident = `c_${ident}`
  if (RESERVED.has(ident)) ident = `c_${ident}`
  return ident
}

function q(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}
