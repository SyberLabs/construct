import { portSpec, specOf } from '../model/catalog.ts'
import { cellKey } from '../model/ids.ts'
import type {
  Diagnostic,
  Machine,
  Pipe,
  PortRef,
  World,
} from '../model/types.ts'

function sortedMachines(world: World): Machine[] {
  return Object.values(world.machines).sort((a, b) => a.id.localeCompare(b.id))
}

function sortedPipes(world: World): Pipe[] {
  return Object.values(world.pipes).sort((a, b) => a.id.localeCompare(b.id))
}

function refKey(ref: PortRef): string {
  return `${ref.machineId}:${ref.portId}`
}

export function describeConnectError(
  world: World,
  from: PortRef,
  to: PortRef,
): string | null {
  if (from.machineId === to.machineId) {
    return 'A machine cannot connect to itself in V0.1.'
  }
  const source = world.machines[from.machineId]
  const target = world.machines[to.machineId]
  if (!source || !target) return 'Both ends must be placed machines.'
  const sourcePort = portSpec(source.kind, from.portId)
  const targetPort = portSpec(target.kind, to.portId)
  if (!sourcePort || !targetPort) return 'Unknown port.'
  if (sourcePort.direction !== 'out' || targetPort.direction !== 'in') {
    return 'Connect an output port to an input port.'
  }
  if (sourcePort.channel !== targetPort.channel) {
    return `Channel mismatch: ${sourcePort.channel} → ${targetPort.channel}.`
  }
  const duplicate = sortedPipes(world).some(
    (pipe) => refKey(pipe.from) === refKey(from) && refKey(pipe.to) === refKey(to),
  )
  if (duplicate) return 'That pipe already exists.'
  return null
}

export function isCompatiblePort(
  world: World,
  pending: PortRef,
  candidate: PortRef,
): boolean {
  if (pending.machineId === candidate.machineId && pending.portId === candidate.portId) {
    return false
  }
  return (
    describeConnectError(world, pending, candidate) === null ||
    describeConnectError(world, candidate, pending) === null
  )
}

export function validateWorld(world: World): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const machines = sortedMachines(world)
  const pipes = sortedPipes(world)
  const occupied = new Map<string, string[]>()

  for (const machine of machines) {
    const key = cellKey(machine.position)
    const list = occupied.get(key) ?? []
    list.push(machine.id)
    occupied.set(key, list)
  }
  for (const ids of occupied.values()) {
    if (ids.length > 1) {
      diagnostics.push({
        id: `overlap-${ids.join('-')}`,
        code: 'OVERLAP',
        severity: 'error',
        message: 'Multiple machines occupy the same cell.',
        machineIds: ids,
        pipeIds: [],
      })
    }
  }

  const validIncident = new Map<string, number>()
  const usedInputs = new Set<string>()

  for (const pipe of pipes) {
    const source = world.machines[pipe.from.machineId]
    const target = world.machines[pipe.to.machineId]
    if (!source || !target) {
      diagnostics.push({
        id: `dangle-${pipe.id}`,
        code: 'DANGLING_PORT_REF',
        severity: 'error',
        message: 'Pipe points at a missing machine.',
        machineIds: [pipe.from.machineId, pipe.to.machineId].filter(Boolean),
        pipeIds: [pipe.id],
      })
      continue
    }
    const sourcePort = portSpec(source.kind, pipe.from.portId)
    const targetPort = portSpec(target.kind, pipe.to.portId)
    if (!sourcePort || !targetPort) {
      diagnostics.push({
        id: `dangle-port-${pipe.id}`,
        code: 'DANGLING_PORT_REF',
        severity: 'error',
        message: 'Pipe points at a missing port.',
        machineIds: [source.id, target.id],
        pipeIds: [pipe.id],
      })
      continue
    }
    if (source.id === target.id) {
      diagnostics.push({
        id: `self-${pipe.id}`,
        code: 'SELF_PIPE',
        severity: 'error',
        message: `${source.name} connects to itself.`,
        machineIds: [source.id],
        pipeIds: [pipe.id],
      })
      continue
    }
    if (sourcePort.direction !== 'out' || targetPort.direction !== 'in') {
      diagnostics.push({
        id: `dir-${pipe.id}`,
        code: 'DIRECTION_INVALID',
        severity: 'error',
        message: `Pipe ${source.name} → ${target.name} is not output to input.`,
        machineIds: [source.id, target.id],
        pipeIds: [pipe.id],
      })
      continue
    }
    if (
      sourcePort.channel !== targetPort.channel ||
      pipe.channel !== sourcePort.channel
    ) {
      diagnostics.push({
        id: `type-${pipe.id}`,
        code: 'TYPE_MISMATCH',
        severity: 'error',
        message: `Channel mismatch on ${source.name} → ${target.name}.`,
        machineIds: [source.id, target.id],
        pipeIds: [pipe.id],
      })
      continue
    }
    validIncident.set(source.id, (validIncident.get(source.id) ?? 0) + 1)
    validIncident.set(target.id, (validIncident.get(target.id) ?? 0) + 1)
    usedInputs.add(refKey(pipe.to))
  }

  for (const machine of machines) {
    if ((validIncident.get(machine.id) ?? 0) === 0) {
      diagnostics.push({
        id: `disc-${machine.id}`,
        code: 'DISCONNECTED',
        severity: 'warning',
        message: `${machine.name} is not connected.`,
        machineIds: [machine.id],
        pipeIds: [],
      })
    }
    for (const port of specOf(machine.kind).ports) {
      if (port.direction !== 'in') continue
      if (machine.kind === 'service' || machine.kind === 'client') continue
      if (!usedInputs.has(`${machine.id}:${port.id}`)) {
        diagnostics.push({
          id: `unused-${machine.id}-${port.id}`,
          code: 'UNUSED_INPUT',
          severity: 'warning',
          message: `${machine.name} input “${port.label}” has no pipe.`,
          machineIds: [machine.id],
          pipeIds: [],
        })
      }
    }
  }

  return diagnostics
}

export function isPipeValid(pipe: Pipe, diagnostics: Diagnostic[]): boolean {
  return !diagnostics.some(
    (item) => item.severity === 'error' && item.pipeIds.includes(pipe.id),
  )
}
