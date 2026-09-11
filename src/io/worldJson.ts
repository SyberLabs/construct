import { MACHINE_KINDS, hydrateLatency, hydrateParams } from '../model/catalog.ts'
import type { ChannelKind, Machine, MachineKind, Pipe, RotationY, World } from '../model/types.ts'

export const WORLD_FORMAT = 'constructs.world'
export const WORLD_VERSION = 1

export type WorldMeta = {
  name?: string
  description?: string
}

export type WorldDocument = {
  format: typeof WORLD_FORMAT
  version: typeof WORLD_VERSION
  name?: string
  description?: string
  world: World
}

export type ParseResult =
  | { ok: true; world: World; name?: string; description?: string }
  | { ok: false; error: string }

const KINDS = new Set<string>(MACHINE_KINDS)
const CHANNELS = new Set<ChannelKind>(['request', 'async', 'data'])
const ROTATIONS = new Set<RotationY>([0, 90, 180, 270])

export function serializeWorld(world: World, meta: WorldMeta = {}): string {
  const machines = Object.fromEntries(
    Object.values(world.machines)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((machine) => [machine.id, pickMachine(machine)]),
  )
  const pipes = Object.fromEntries(
    Object.values(world.pipes)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((pipe) => [pipe.id, pickPipe(pipe)]),
  )
  const document: WorldDocument = {
    format: WORLD_FORMAT,
    version: WORLD_VERSION,
    world: { machines, pipes },
  }
  if (meta.name) document.name = meta.name
  if (meta.description) document.description = meta.description
  return `${JSON.stringify(document, null, 2)}\n`
}

export function parseWorldDocument(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }
  if (!isRecord(raw)) return { ok: false, error: 'World file must be an object.' }

  if (isRecord(raw.world) || raw.format === WORLD_FORMAT) {
    if (raw.format !== WORLD_FORMAT) {
      return { ok: false, error: 'Not a Constructs world file.' }
    }
    if (raw.version !== WORLD_VERSION) {
      return {
        ok: false,
        error: `Unsupported world version ${String(raw.version)} (expected ${WORLD_VERSION}).`,
      }
    }
    if (!isRecord(raw.world)) return { ok: false, error: 'Missing world object.' }
    const parsed = parseWorld(raw.world)
    if (!parsed.ok) return parsed
    return {
      ...parsed,
      name: optionalString(raw.name),
      description: optionalString(raw.description),
    }
  }

  if ('machines' in raw && 'pipes' in raw) {
    return parseWorld(raw)
  }

  return { ok: false, error: 'Not a Constructs world file.' }
}

function parseWorld(raw: Record<string, unknown>): ParseResult {
  if (!isRecord(raw.machines) || !isRecord(raw.pipes)) {
    return { ok: false, error: 'World must include machines and pipes objects.' }
  }

  const machines: World['machines'] = {}
  for (const [key, value] of Object.entries(raw.machines)) {
    const machine = parseMachine(key, value)
    if (typeof machine === 'string') return { ok: false, error: machine }
    machines[machine.id] = machine
  }

  const pipes: World['pipes'] = {}
  for (const [key, value] of Object.entries(raw.pipes)) {
    const pipe = parsePipe(key, value)
    if (typeof pipe === 'string') return { ok: false, error: pipe }
    pipes[pipe.id] = pipe
  }

  return { ok: true, world: { machines, pipes } }
}

function parseMachine(key: string, value: unknown): Machine | string {
  if (!isRecord(value)) return `Machine "${key}" is not an object.`
  if (typeof value.id !== 'string' || value.id !== key) {
    return `Machine key "${key}" must match id.`
  }
  if (typeof value.kind !== 'string' || !KINDS.has(value.kind)) {
    return `Machine "${key}" has unknown kind ${JSON.stringify(value.kind)}.`
  }
  if (typeof value.name !== 'string' || value.name.length === 0) {
    return `Machine "${key}" needs a name.`
  }
  if (!isRecord(value.position)) return `Machine "${key}" needs a position.`
  const x = asInt(value.position.x)
  const y = asInt(value.position.y)
  const z = asInt(value.position.z)
  if (x === null || y === null || z === null) {
    return `Machine "${key}" position must be integer x/y/z.`
  }
  if (typeof value.rotation !== 'number' || !ROTATIONS.has(value.rotation as RotationY)) {
    return `Machine "${key}" rotation must be 0, 90, 180, or 270.`
  }
  return {
    id: value.id,
    kind: value.kind as MachineKind,
    name: value.name,
    position: { x, y, z },
    rotation: value.rotation as RotationY,
    params: hydrateParams(value.kind as MachineKind, value.params),
  }
}

function parsePipe(key: string, value: unknown): Pipe | string {
  if (!isRecord(value)) return `Pipe "${key}" is not an object.`
  if (typeof value.id !== 'string' || value.id !== key) {
    return `Pipe key "${key}" must match id.`
  }
  const from = parsePortRef(value.from)
  const to = parsePortRef(value.to)
  if (!from || !to) return `Pipe "${key}" needs from/to port refs.`
  if (typeof value.channel !== 'string' || !CHANNELS.has(value.channel as ChannelKind)) {
    return `Pipe "${key}" has unknown channel ${JSON.stringify(value.channel)}.`
  }
  return {
    id: value.id,
    from,
    to,
    channel: value.channel as ChannelKind,
    latencyMs: hydrateLatency(value.latencyMs),
  }
}

function parsePortRef(value: unknown): Pipe['from'] | null {
  if (!isRecord(value)) return null
  if (typeof value.machineId !== 'string' || typeof value.portId !== 'string') return null
  if (value.machineId.length === 0 || value.portId.length === 0) return null
  return { machineId: value.machineId, portId: value.portId }
}

function pickMachine(machine: Machine): Machine {
  return {
    id: machine.id,
    kind: machine.kind,
    name: machine.name,
    position: {
      x: machine.position.x,
      y: machine.position.y,
      z: machine.position.z,
    },
    rotation: machine.rotation,
    params: hydrateParams(machine.kind, machine.params),
  }
}

function pickPipe(pipe: Pipe): Pipe {
  return {
    id: pipe.id,
    from: { machineId: pipe.from.machineId, portId: pipe.from.portId },
    to: { machineId: pipe.to.machineId, portId: pipe.to.portId },
    channel: pipe.channel,
    latencyMs: hydrateLatency(pipe.latencyMs),
  }
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isFinite(value)) {
    return null
  }
  return value
}
