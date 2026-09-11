import { hydrateLatency, hydrateParams, specOf } from '../model/catalog.ts'
import type { CompiledSystem, GraphEdge, GraphNode, World } from '../model/types.ts'
import { toMermaid } from './mermaid.ts'
import { toStructurizrDsl } from './structurizr.ts'
import { isPipeValid, validateWorld } from './validate.ts'

export function compile(world: World): CompiledSystem {
  const diagnostics = validateWorld(world)
  const nodes: GraphNode[] = Object.values(world.machines)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((machine) => ({
      id: machine.id,
      kind: machine.kind,
      label: specOf(machine.kind).label,
      name: machine.name,
      params: hydrateParams(machine.kind, machine.params),
    }))

  const validPipeIds: string[] = []
  const edges: GraphEdge[] = []
  for (const pipe of Object.values(world.pipes).sort((a, b) => a.id.localeCompare(b.id))) {
    if (!isPipeValid(pipe, diagnostics)) continue
    validPipeIds.push(pipe.id)
    edges.push({
      id: pipe.id,
      source: pipe.from.machineId,
      target: pipe.to.machineId,
      sourcePort: pipe.from.portId,
      targetPort: pipe.to.portId,
      channel: pipe.channel,
      label: pipe.channel,
      latencyMs: hydrateLatency(pipe.latencyMs),
    })
  }

  return {
    nodes,
    edges,
    diagnostics,
    mermaid: toMermaid(nodes, edges),
    structurizr: toStructurizrDsl(world, nodes, edges),
    validPipeIds,
  }
}
