import { describe, expect, it } from 'vitest'
import { sampleWorld } from '../model/sample.ts'
import { AUTOSAVE_KEY, readAutosave, writeAutosave } from './autosave.ts'
import { serializeWorld } from './worldJson.ts'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem(key: string) {
      return data.get(key) ?? null
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
    removeItem(key: string) {
      data.delete(key)
    },
  }
}

describe('autosave', () => {
  it('round-trips a world through storage', () => {
    const storage = memoryStorage()
    const world = sampleWorld()
    const json = serializeWorld(world, { name: 'recovered' })
    writeAutosave(json, storage)
    expect(storage.getItem(AUTOSAVE_KEY)).toBe(json)
    const parsed = readAutosave(storage)
    expect(parsed?.ok).toBe(true)
    if (!parsed?.ok) return
    expect(parsed.name).toBe('recovered')
    expect(parsed.world).toEqual(world)
  })

  it('returns null when storage is empty', () => {
    expect(readAutosave(memoryStorage())).toBeNull()
  })
})
