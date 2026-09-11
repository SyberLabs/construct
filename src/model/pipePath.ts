import type { Vec3 } from './types.ts'
import { worldToGrid } from './geometry.ts'

function keyXZ(cell: { x: number; z: number }): string {
  return `${cell.x},${cell.z}`
}

function cellsAlong(from: Vec3, to: Vec3): string[] {
  const a = worldToGrid(from)
  const b = worldToGrid(to)
  const keys: string[] = [keyXZ(a)]
  const stepX = Math.sign(b.x - a.x)
  const stepZ = Math.sign(b.z - a.z)
  let x = a.x
  let z = a.z
  while (x !== b.x || z !== b.z) {
    if (x !== b.x) x += stepX
    else z += stepZ
    keys.push(keyXZ({ x, z }))
  }
  return keys
}

function collisionCount(
  points: Vec3[],
  blocked: Set<string>,
  ignore: Set<string>,
): number {
  const hit = new Set<string>()
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i]
    const to = points[i + 1]
    if (!from || !to) continue
    for (const cell of cellsAlong(from, to)) {
      if (ignore.has(cell)) continue
      if (blocked.has(cell)) hit.add(cell)
    }
  }
  return hit.size
}

export function orthogonalPipePoints(
  start: Vec3,
  end: Vec3,
  occupied: Iterable<Vec3>,
  ignore: Iterable<Vec3>,
): Vec3[] {
  if (Math.abs(start.x - end.x) < 1e-6 || Math.abs(start.z - end.z) < 1e-6) {
    return [start, end]
  }
  const y = start.y
  const xThenZ: Vec3[] = [start, { x: end.x, y, z: start.z }, end]
  const zThenX: Vec3[] = [start, { x: start.x, y, z: end.z }, end]
  const blocked = new Set(Array.from(occupied, (cell) => keyXZ(cell)))
  const ignoreSet = new Set(Array.from(ignore, (cell) => keyXZ(cell)))
  const costX = collisionCount(xThenZ, blocked, ignoreSet)
  const costZ = collisionCount(zThenX, blocked, ignoreSet)
  if (costZ < costX) return zThenX
  return xThenZ
}
