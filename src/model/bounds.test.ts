import { describe, expect, it } from 'vitest'
import { occupiedBounds } from './bounds.ts'
import { CELL } from './geometry.ts'
import type { Machine } from './types.ts'

function machine(id: string, x: number, z: number): Machine {
  return {
    id,
    kind: 'cache',
    name: id,
    position: { x, y: 0, z },
    rotation: 0,
  }
}

describe('occupiedBounds', () => {
  it('returns null for an empty factory', () => {
    expect(occupiedBounds([])).toBeNull()
  })

  it('centers on a single machine cell', () => {
    const bounds = occupiedBounds([machine('a', 2, -1)])
    expect(bounds).not.toBeNull()
    if (!bounds) return
    expect(bounds.center.x).toBeCloseTo(2 * CELL)
    expect(bounds.center.z).toBeCloseTo(-1 * CELL)
    expect(bounds.radius).toBeGreaterThan(0)
  })

  it('spans two machines', () => {
    const bounds = occupiedBounds([machine('a', 0, 0), machine('b', 4, 0)])
    expect(bounds).not.toBeNull()
    if (!bounds) return
    expect(bounds.center.x).toBeCloseTo(2 * CELL)
    expect(bounds.center.z).toBeCloseTo(0)
    expect(bounds.radius).toBeGreaterThan(2 * CELL)
  })
})
