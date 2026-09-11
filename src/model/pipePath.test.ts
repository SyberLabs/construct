import { describe, expect, it } from 'vitest'
import { CELL, gridToWorld } from './geometry.ts'
import { orthogonalPipePoints } from './pipePath.ts'

function cell(x: number, z: number) {
  const p = gridToWorld({ x, y: 0, z })
  return { x: p.x, y: 0.46, z: p.z }
}

describe('orthogonalPipePoints', () => {
  it('is a straight segment when start and end share an axis', () => {
    const start = cell(0, 0)
    const end = cell(3, 0)
    const points = orthogonalPipePoints(start, end, [{ x: 1, y: 0, z: 0 }], [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ])
    expect(points).toEqual([start, end])
  })

  it('picks the elbow that crosses fewer occupied cells', () => {
    const start = cell(0, 0)
    const end = cell(2, 2)
    const ignore = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 2 },
    ]
    const blockedXThenZ = orthogonalPipePoints(start, end, [{ x: 2, y: 0, z: 0 }], ignore)
    const blockedZThenX = orthogonalPipePoints(start, end, [{ x: 0, y: 0, z: 2 }], ignore)

    expect(blockedXThenZ).toEqual([
      start,
      { x: start.x, y: start.y, z: end.z },
      end,
    ])
    expect(blockedZThenX).toEqual([
      start,
      { x: end.x, y: start.y, z: start.z },
      end,
    ])
  })

  it('keeps the elbow on the start height', () => {
    const start = { x: 0, y: 0.4, z: 0 }
    const end = { x: CELL * 2, y: 0.9, z: CELL * 2 }
    const points = orthogonalPipePoints(start, end, [], [])
    expect(points).toHaveLength(3)
    expect(points[1]?.y).toBe(start.y)
  })
})
