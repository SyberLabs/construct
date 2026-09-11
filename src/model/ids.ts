export function createId(prefix: string): string {
  const rand = Math.random().toString(16).slice(2, 8)
  const time = Date.now().toString(16).slice(-6)
  return `${prefix}_${time}${rand}`
}

export function cellKey(position: { x: number; y: number; z: number }): string {
  return `${position.x},${position.y},${position.z}`
}
