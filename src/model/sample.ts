import { defaultParams } from './catalog.ts'
import { createId } from './ids.ts'
import type { Machine, Pipe, World } from './types.ts'

function machine(
  kind: Machine['kind'],
  name: string,
  x: number,
  z: number,
  rotation: Machine['rotation'] = 0,
): Machine {
  return {
    id: createId(kind),
    kind,
    name,
    position: { x, y: 0, z },
    rotation,
    params: defaultParams(kind),
  }
}

function pipe(
  from: Machine,
  fromPort: string,
  to: Machine,
  toPort: string,
  channel: Pipe['channel'],
): Pipe {
  return {
    id: createId('pipe'),
    from: { machineId: from.id, portId: fromPort },
    to: { machineId: to.id, portId: toPort },
    channel,
    latencyMs: 0,
  }
}

export function emptyWorld(): World {
  return { machines: {}, pipes: {} }
}

export function sampleWorld(): World {
  const client = machine('client', 'web-client', 0, -5)
  const lb = machine('loadBalancer', 'edge-lb', 0, -3)
  const limiter = machine('rateLimiter', 'edge-limit', 0, -1)
  const breaker = machine('circuitBreaker', 'api-breaker', 0, 1)
  const api = machine('service', 'api-service', 0, 3)
  const cache = machine('cache', 'session-cache', -2, 3, 270)
  const db = machine('database', 'primary-db', 2, 3, 90)
  const queue = machine('queue', 'jobs', 0, 5)
  const worker = machine('service', 'worker', 0, 7)

  const machines = [client, lb, limiter, breaker, api, cache, db, queue, worker]
  const pipes = [
    pipe(client, 'out', lb, 'in', 'request'),
    pipe(lb, 'out', limiter, 'in', 'request'),
    pipe(limiter, 'out', breaker, 'in', 'request'),
    pipe(breaker, 'out', api, 'in', 'request'),
    pipe(api, 'store', cache, 'in', 'data'),
    pipe(api, 'store', db, 'in', 'data'),
    pipe(api, 'publish', queue, 'in', 'async'),
    pipe(queue, 'out', worker, 'consume', 'async'),
  ]

  return {
    machines: Object.fromEntries(machines.map((item) => [item.id, item])),
    pipes: Object.fromEntries(pipes.map((item) => [item.id, item])),
  }
}
