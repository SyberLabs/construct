import type { Face, Machine, PortSpec, RotationY, Vec3 } from './types.ts'

export const CELL = 1.75
export const MACHINE_W = 1.12
export const MACHINE_H = 0.92
export const PORT_RADIUS = 0.09
export const PORT_PICK_RADIUS = PORT_RADIUS * 2
export const PORT_PROTRUDE = 0.08

const FACE_DIR: Record<Face, Vec3> = {
  posX: { x: 1, y: 0, z: 0 },
  negX: { x: -1, y: 0, z: 0 },
  posZ: { x: 0, y: 0, z: 1 },
  negZ: { x: 0, y: 0, z: -1 },
}

const FACE_TANGENT: Record<Face, Vec3> = {
  posX: { x: 0, y: 0, z: 1 },
  negX: { x: 0, y: 0, z: 1 },
  posZ: { x: 1, y: 0, z: 0 },
  negZ: { x: 1, y: 0, z: 0 },
}

export function gridToWorld(position: Vec3): Vec3 {
  return {
    x: position.x * CELL,
    y: position.y * CELL,
    z: position.z * CELL,
  }
}

export function worldToGrid(point: Vec3): Vec3 {
  return {
    x: Math.round(point.x / CELL),
    y: 0,
    z: Math.round(point.z / CELL),
  }
}

export function nextRotation(rotation: RotationY): RotationY {
  return ((rotation + 90) % 360) as RotationY
}

/** Clockwise in the XZ plane when looking from +Y (top-down). */
export function rotateYaw(vec: Vec3, rotation: RotationY): Vec3 {
  const steps = rotation / 90
  let { x, y, z } = vec
  for (let i = 0; i < steps; i += 1) {
    const nx = z
    const nz = -x
    x = nx
    z = nz
  }
  return { x, y, z }
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s }
}

export function portWorldPosition(machine: Machine, port: PortSpec): Vec3 {
  const origin = gridToWorld(machine.position)
  origin.y += MACHINE_H / 2
  const dir = rotateYaw(FACE_DIR[port.face], machine.rotation)
  const tangent = rotateYaw(FACE_TANGENT[port.face], machine.rotation)
  const alongFace = scale(dir, MACHINE_W / 2 + PORT_PROTRUDE)
  const slotShift = scale(tangent, port.slot * 0.28)
  return add(add(origin, alongFace), slotShift)
}

export function occupancyMap(machines: Iterable<Machine>): Map<string, string> {
  const map = new Map<string, string>()
  for (const machine of machines) {
    map.set(`${machine.position.x},${machine.position.y},${machine.position.z}`, machine.id)
  }
  return map
}
