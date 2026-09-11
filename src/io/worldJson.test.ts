import { describe, expect, it } from 'vitest'
import { sampleWorld } from '../model/sample.ts'
import { parseWorldDocument, serializeWorld } from './worldJson.ts'

describe('world JSON', () => {
  it('round-trips the sample world', () => {
    const world = sampleWorld()
    const parsed = parseWorldDocument(serializeWorld(world))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.world).toEqual(world)
  })

  it('accepts a bare world object without the envelope', () => {
    const world = sampleWorld()
    const parsed = parseWorldDocument(JSON.stringify(world))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(Object.keys(parsed.world.machines)).toEqual(Object.keys(world.machines))
  })

  it('rejects garbage', () => {
    expect(parseWorldDocument('not json').ok).toBe(false)
    expect(parseWorldDocument('[]').ok).toBe(false)
    expect(parseWorldDocument('null').ok).toBe(false)
  })

  it('rejects unknown machine kinds', () => {
    const parsed = parseWorldDocument(
      JSON.stringify({
        format: 'constructs.world',
        version: 1,
        world: {
          machines: {
            a: {
              id: 'a',
              kind: 'kubernetes',
              name: 'nope',
              position: { x: 0, y: 0, z: 0 },
              rotation: 0,
            },
          },
          pipes: {},
        },
      }),
    )
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toMatch(/kind/i)
  })

  it('rejects id/key mismatches', () => {
    const parsed = parseWorldDocument(
      JSON.stringify({
        format: 'constructs.world',
        version: 1,
        world: {
          machines: {
            a: {
              id: 'b',
              kind: 'cache',
              name: 'cache',
              position: { x: 0, y: 0, z: 0 },
              rotation: 0,
            },
          },
          pipes: {},
        },
      }),
    )
    expect(parsed.ok).toBe(false)
  })

  it('rejects unsupported versions', () => {
    const parsed = parseWorldDocument(
      JSON.stringify({
        format: 'constructs.world',
        version: 99,
        world: { machines: {}, pipes: {} },
      }),
    )
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toMatch(/version/i)
  })

  it('round-trips optional name and description without bumping version', () => {
    const world = sampleWorld()
    const json = serializeWorld(world, {
      name: 'Edge path',
      description: 'teaching',
    })
    const parsed = parseWorldDocument(json)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.name).toBe('Edge path')
    expect(parsed.description).toBe('teaching')
    expect(JSON.parse(json).version).toBe(1)
  })

  it('loads v1 files that omit name', () => {
    const world = sampleWorld()
    const parsed = parseWorldDocument(serializeWorld(world))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.name).toBeUndefined()
    expect(parsed.world).toEqual(world)
  })

  it('fills catalog defaults for v1 machines and pipes that omit params', () => {
    const parsed = parseWorldDocument(
      JSON.stringify({
        format: 'constructs.world',
        version: 1,
        world: {
          machines: {
            a: {
              id: 'a',
              kind: 'cache',
              name: 'session',
              position: { x: 0, y: 0, z: 0 },
              rotation: 0,
            },
            b: {
              id: 'b',
              kind: 'queue',
              name: 'jobs',
              position: { x: 1, y: 0, z: 0 },
              rotation: 0,
            },
          },
          pipes: {},
        },
      }),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.world.machines.a?.params).toEqual({
      serviceMs: 1,
      hitRatio: 0.9,
    })
    expect(parsed.world.machines.b?.params).toEqual({
      maxDepth: 1000,
      ackImmediate: true,
    })
  })
})
