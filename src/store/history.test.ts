import { describe, expect, it } from 'vitest'
import { emptyWorld } from '../model/sample.ts'
import type { World } from '../model/types.ts'
import {
  HISTORY_LIMIT,
  cloneWorld,
  emptyHistory,
  record,
  redo,
  undo,
} from './history.ts'

function named(name: string): World {
  return {
    machines: {
      a: {
        id: 'a',
        kind: 'cache',
        name,
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
      },
    },
    pipes: {},
  }
}

describe('history', () => {
  it('undo with no past returns null', () => {
    const present = emptyWorld()
    expect(undo(emptyHistory(), present)).toBeNull()
  })

  it('undo restores the recorded world', () => {
    const before = emptyWorld()
    const after = named('placed')
    const history = record(emptyHistory(), before)
    const result = undo(history, after)
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.world).toEqual(before)
    expect(result.history.past).toHaveLength(0)
  })

  it('redo restores the world undone from', () => {
    const before = emptyWorld()
    const after = named('placed')
    const history = record(emptyHistory(), before)
    const undone = undo(history, after)
    expect(undone).not.toBeNull()
    if (!undone) return
    const redone = redo(undone.history, undone.world)
    expect(redone).not.toBeNull()
    if (!redone) return
    expect(redone.world).toEqual(after)
  })

  it('recording after undo discards redo', () => {
    const a = emptyWorld()
    const b = named('b')
    const c = named('c')
    const afterUndo = undo(record(emptyHistory(), a), b)
    expect(afterUndo).not.toBeNull()
    if (!afterUndo) return
    const branched = record(afterUndo.history, afterUndo.world)
    expect(redo(branched, c)).toBeNull()
  })

  it('drops the oldest snapshot past the cap', () => {
    let history = emptyHistory()
    for (let i = 0; i < HISTORY_LIMIT + 5; i += 1) {
      history = record(history, named(`n${i}`))
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT)
    expect(history.past[0]).toEqual(named('n5'))
  })

  it('cloneWorld is a deep copy', () => {
    const world = named('src')
    const copy = cloneWorld(world)
    world.machines.a.name = 'mutated'
    expect(copy.machines.a.name).toBe('src')
  })
})
