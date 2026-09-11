import type { World } from '../model/types.ts'

export const HISTORY_LIMIT = 100

export type HistoryState = {
  past: World[]
  future: World[]
}

export function emptyHistory(): HistoryState {
  return { past: [], future: [] }
}

export function cloneWorld(world: World): World {
  return structuredClone(world)
}

export function record(history: HistoryState, before: World): HistoryState {
  const past = [...history.past, cloneWorld(before)]
  while (past.length > HISTORY_LIMIT) past.shift()
  return { past, future: [] }
}

export function undo(
  history: HistoryState,
  present: World,
): { history: HistoryState; world: World } | null {
  if (history.past.length === 0) return null
  const past = history.past.slice(0, -1)
  const world = history.past[history.past.length - 1]
  if (!world) return null
  return {
    world,
    history: {
      past,
      future: [...history.future, cloneWorld(present)],
    },
  }
}

export function redo(
  history: HistoryState,
  present: World,
): { history: HistoryState; world: World } | null {
  if (history.future.length === 0) return null
  const future = history.future.slice(0, -1)
  const world = history.future[history.future.length - 1]
  if (!world) return null
  return {
    world,
    history: {
      past: [...history.past, cloneWorld(present)],
      future,
    },
  }
}
