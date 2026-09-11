import { CELL, gridToWorld } from './geometry.ts'
import type { Machine, Vec3 } from './types.ts'

export type OccupiedBounds = {
  center: Vec3
  radius: number
}

export function occupiedBounds(machines: Iterable<Machine>): OccupiedBounds | null {
  const list = Array.from(machines)
  if (list.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const machine of list) {
    const p = gridToWorld(machine.position)
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minZ = Math.min(minZ, p.z)
    maxZ = Math.max(maxZ, p.z)
  }
  const center = {
    x: (minX + maxX) / 2,
    y: 0,
    z: (minZ + maxZ) / 2,
  }
  const halfW = (maxX - minX) / 2
  const halfD = (maxZ - minZ) / 2
  const radius = Math.max(Math.hypot(halfW, halfD), CELL * 0.8) + CELL * 0.6
  return { center, radius }
}

export function frameCameraPose(bounds: OccupiedBounds): {
  position: Vec3
  target: Vec3
} {
  const dist = Math.max(8, bounds.radius * 2.35)
  return {
    position: {
      x: bounds.center.x + dist * 0.72,
      y: dist * 0.95,
      z: bounds.center.z + dist * 0.72,
    },
    target: { x: bounds.center.x, y: 0.45, z: bounds.center.z },
  }
}
