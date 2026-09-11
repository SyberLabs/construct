import type {
  ChannelKind,
  MachineKind,
  MachineSpec,
  ParamSpec,
  ParamValue,
  PortSpec,
} from './types.ts'

export const MACHINE_KINDS: readonly MachineKind[] = [
  'client',
  'loadBalancer',
  'rateLimiter',
  'circuitBreaker',
  'service',
  'queue',
  'cache',
  'database',
] as const

export const CHANNEL_COLORS: Record<ChannelKind, string> = {
  request: '#5eead4',
  async: '#c4b5fd',
  data: '#fdba74',
}

const REQUEST_IN: PortSpec = {
  id: 'in',
  label: 'in',
  direction: 'in',
  channel: 'request',
  face: 'negZ',
  slot: 0,
}

const REQUEST_OUT: PortSpec = {
  id: 'out',
  label: 'out',
  direction: 'out',
  channel: 'request',
  face: 'posZ',
  slot: 0,
}

const LB_SERVICE_PARAMS: readonly ParamSpec[] = [
  { id: 'instances', label: 'Instances', kind: 'number', default: 1, min: 1, step: 1 },
  { id: 'capacity', label: 'Capacity', kind: 'number', default: 100, min: 1, step: 1 },
  { id: 'serviceMs', label: 'Service ms', kind: 'number', default: 10, min: 0, step: 1 },
]

export const MACHINE_CATALOG: Record<MachineKind, MachineSpec> = {
  client: {
    kind: 'client',
    label: 'Client',
    short: 'CLI',
    color: '#2dd4bf',
    description: 'External origin of synchronous requests.',
    ports: [
      {
        id: 'out',
        label: 'requests',
        direction: 'out',
        channel: 'request',
        face: 'posZ',
        slot: 0,
      },
    ],
    params: [],
  },
  loadBalancer: {
    kind: 'loadBalancer',
    label: 'Load balancer',
    short: 'LB',
    color: '#60a5fa',
    description: 'Fans synchronous requests out to services.',
    ports: [REQUEST_IN, REQUEST_OUT],
    params: [
      { id: 'instances', label: 'Instances', kind: 'number', default: 1, min: 1, step: 1 },
      { id: 'capacity', label: 'Capacity', kind: 'number', default: 100, min: 1, step: 1 },
      { id: 'serviceMs', label: 'Service ms', kind: 'number', default: 1, min: 0, step: 1 },
    ],
  },
  rateLimiter: {
    kind: 'rateLimiter',
    label: 'Rate limiter',
    short: 'RL',
    color: '#f472b6',
    description: 'Caps request admission. Excess waits or is refused in sim.',
    ports: [REQUEST_IN, { ...REQUEST_OUT, label: 'admit' }],
    params: [
      { id: 'limitPerSec', label: 'Limit / sec', kind: 'number', default: 100, min: 1, step: 1 },
    ],
  },
  circuitBreaker: {
    kind: 'circuitBreaker',
    label: 'Circuit breaker',
    short: 'CB',
    color: '#fb7185',
    description: 'Opens after consecutive failures; half-open after reset.',
    ports: [REQUEST_IN, { ...REQUEST_OUT, label: 'protected' }],
    params: [
      {
        id: 'failureThreshold',
        label: 'Failure threshold',
        kind: 'number',
        default: 5,
        min: 1,
        step: 1,
      },
      { id: 'resetMs', label: 'Reset ms', kind: 'number', default: 1000, min: 0, step: 50 },
    ],
  },
  service: {
    kind: 'service',
    label: 'Service',
    short: 'SVC',
    color: '#fbbf24',
    description: 'Compute. Calls other services, queues, and stores.',
    ports: [
      REQUEST_IN,
      REQUEST_OUT,
      {
        id: 'publish',
        label: 'publish',
        direction: 'out',
        channel: 'async',
        face: 'posX',
        slot: 0,
      },
      {
        id: 'consume',
        label: 'consume',
        direction: 'in',
        channel: 'async',
        face: 'negX',
        slot: 1,
      },
      {
        id: 'store',
        label: 'data',
        direction: 'out',
        channel: 'data',
        face: 'negX',
        slot: 0,
      },
    ],
    params: LB_SERVICE_PARAMS,
  },
  queue: {
    kind: 'queue',
    label: 'Queue',
    short: 'Q',
    color: '#a78bfa',
    description: 'Durable async buffer between publishers and workers.',
    ports: [
      {
        id: 'in',
        label: 'publish',
        direction: 'in',
        channel: 'async',
        face: 'negZ',
        slot: 0,
      },
      {
        id: 'out',
        label: 'consume',
        direction: 'out',
        channel: 'async',
        face: 'posZ',
        slot: 0,
      },
    ],
    params: [
      { id: 'maxDepth', label: 'Max depth', kind: 'number', default: 1000, min: 1, step: 1 },
      { id: 'ackImmediate', label: 'Ack immediately', kind: 'boolean', default: true },
    ],
  },
  cache: {
    kind: 'cache',
    label: 'Cache',
    short: 'CACHE',
    color: '#fb923c',
    description: 'Low-latency data store.',
    ports: [
      {
        id: 'in',
        label: 'get/set',
        direction: 'in',
        channel: 'data',
        face: 'negZ',
        slot: 0,
      },
    ],
    params: [
      { id: 'serviceMs', label: 'Service ms', kind: 'number', default: 1, min: 0, step: 1 },
      { id: 'hitRatio', label: 'Hit ratio', kind: 'number', default: 0.9, min: 0, max: 1, step: 0.05 },
    ],
  },
  database: {
    kind: 'database',
    label: 'Database',
    short: 'DB',
    color: '#34d399',
    description: 'Durable data store.',
    ports: [
      {
        id: 'in',
        label: 'queries',
        direction: 'in',
        channel: 'data',
        face: 'negZ',
        slot: 0,
      },
    ],
    params: [
      { id: 'serviceMs', label: 'Service ms', kind: 'number', default: 20, min: 0, step: 1 },
    ],
  },
}

export function specOf(kind: MachineKind): MachineSpec {
  return MACHINE_CATALOG[kind]
}

export function portSpec(kind: MachineKind, portId: string) {
  return specOf(kind).ports.find((port) => port.id === portId)
}

export function defaultParams(kind: MachineKind): Record<string, ParamValue> {
  return Object.fromEntries(specOf(kind).params.map((item) => [item.id, item.default]))
}

export function hydrateParams(
  kind: MachineKind,
  raw: unknown,
): Record<string, ParamValue> {
  const defaults = defaultParams(kind)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults
  const record = raw as Record<string, unknown>
  const next = { ...defaults }
  for (const spec of specOf(kind).params) {
    const value = record[spec.id]
    if (spec.kind === 'boolean') {
      if (typeof value === 'boolean') next[spec.id] = value
      continue
    }
    if (typeof value === 'number' && Number.isFinite(value)) next[spec.id] = value
  }
  return next
}

export function hydrateLatency(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  return 0
}
