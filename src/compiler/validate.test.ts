import { describe, expect, it } from 'vitest'
import type { World } from '../model/types.ts'
import { isCompatiblePort } from './validate.ts'

function world(): World {
  return {
    machines: {
      svc: {
        id: 'svc',
        kind: 'service',
        name: 'svc',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
      },
      cache: {
        id: 'cache',
        kind: 'cache',
        name: 'cache',
        position: { x: 2, y: 0, z: 0 },
        rotation: 0,
      },
      db: {
        id: 'db',
        kind: 'database',
        name: 'db',
        position: { x: 2, y: 0, z: 2 },
        rotation: 0,
      },
    },
    pipes: {},
  }
}

describe('isCompatiblePort', () => {
  it('accepts a data output into a cache input, either click order', () => {
    const w = world()
    const store = { machineId: 'svc', portId: 'store' }
    const inn = { machineId: 'cache', portId: 'in' }
    expect(isCompatiblePort(w, store, inn)).toBe(true)
    expect(isCompatiblePort(w, inn, store)).toBe(true)
  })

  it('rejects a request output into a cache input', () => {
    const w = world()
    expect(
      isCompatiblePort(
        w,
        { machineId: 'svc', portId: 'out' },
        { machineId: 'cache', portId: 'in' },
      ),
    ).toBe(false)
  })

  it('rejects the pending port against itself', () => {
    const w = world()
    const store = { machineId: 'svc', portId: 'store' }
    expect(isCompatiblePort(w, store, store)).toBe(false)
  })
})
