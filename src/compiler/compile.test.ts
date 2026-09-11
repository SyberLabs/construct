import { describe, expect, it } from 'vitest'
import { compile } from './compile.ts'
import { emptyWorld, sampleWorld } from '../model/sample.ts'
import type { World } from '../model/types.ts'

function worldWith(
  machines: World['machines'],
  pipes: World['pipes'] = {},
): World {
  return { machines, pipes }
}

describe('compile', () => {
  it('emits an empty mermaid graph for an empty world', () => {
    const compiled = compile(emptyWorld())
    expect(compiled.nodes).toEqual([])
    expect(compiled.edges).toEqual([])
    expect(compiled.mermaid).toContain('Empty factory')
  })

  it('compiles the sample topology into matching 2D edges and mermaid', () => {
    const compiled = compile(sampleWorld())
    expect(compiled.nodes).toHaveLength(9)
    expect(compiled.edges).toHaveLength(8)
    expect(compiled.nodes.some((node) => node.kind === 'rateLimiter')).toBe(true)
    expect(compiled.nodes.some((node) => node.kind === 'circuitBreaker')).toBe(true)
    expect(compiled.diagnostics.filter((item) => item.severity === 'error')).toEqual([])
    expect(compiled.mermaid).toContain('flowchart LR')
    expect(compiled.mermaid).toMatch(/-->\|request\|/)
    expect(compiled.mermaid).toMatch(/-->\|async\|/)
    expect(compiled.mermaid).toMatch(/-->\|data\|/)
  })

  it('flags overlapping machines', () => {
    const compiled = compile(
      worldWith({
        a: {
          id: 'a',
          kind: 'cache',
          name: 'a',
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
        b: {
          id: 'b',
          kind: 'database',
          name: 'b',
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      }),
    )
    expect(compiled.diagnostics.some((item) => item.code === 'OVERLAP')).toBe(true)
  })

  it('omits type-mismatched pipes from the diagram', () => {
    const compiled = compile(
      worldWith(
        {
          client: {
            id: 'client',
            kind: 'client',
            name: 'client',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
          },
          db: {
            id: 'db',
            kind: 'database',
            name: 'db',
            position: { x: 1, y: 0, z: 0 },
            rotation: 0,
          },
        },
        {
          bad: {
            id: 'bad',
            from: { machineId: 'client', portId: 'out' },
            to: { machineId: 'db', portId: 'in' },
            channel: 'request',
          },
        },
      ),
    )
    expect(compiled.edges).toEqual([])
    expect(compiled.diagnostics.some((item) => item.code === 'TYPE_MISMATCH')).toBe(
      true,
    )
  })

  it('warns when a machine has no valid pipes', () => {
    const compiled = compile(
      worldWith({
        lonely: {
          id: 'lonely',
          kind: 'service',
          name: 'lonely',
          position: { x: 2, y: 0, z: 2 },
          rotation: 0,
        },
      }),
    )
    expect(compiled.diagnostics.some((item) => item.code === 'DISCONNECTED')).toBe(
      true,
    )
  })

  it('forwards machine and pipe params onto the compiled graph', () => {
    const compiled = compile(
      worldWith(
        {
          lim: {
            id: 'lim',
            kind: 'rateLimiter',
            name: 'edge-limit',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            params: { limitPerSec: 50 },
          },
          brk: {
            id: 'brk',
            kind: 'circuitBreaker',
            name: 'api-breaker',
            position: { x: 1, y: 0, z: 0 },
            rotation: 0,
            params: { failureThreshold: 3, resetMs: 2000 },
          },
        },
        {
          hop: {
            id: 'hop',
            from: { machineId: 'lim', portId: 'out' },
            to: { machineId: 'brk', portId: 'in' },
            channel: 'request',
            latencyMs: 5,
          },
        },
      ),
    )
    expect(compiled.diagnostics.filter((item) => item.severity === 'error')).toEqual([])
    expect(compiled.nodes.find((node) => node.id === 'lim')?.params).toEqual({
      limitPerSec: 50,
    })
    expect(compiled.nodes.find((node) => node.id === 'brk')?.params).toEqual({
      failureThreshold: 3,
      resetMs: 2000,
    })
    expect(compiled.edges).toHaveLength(1)
    expect(compiled.edges[0]?.latencyMs).toBe(5)
  })

  it('fills catalog defaults when instance params are omitted', () => {
    const compiled = compile(
      worldWith({
        svc: {
          id: 'svc',
          kind: 'service',
          name: 'api',
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      }),
    )
    expect(compiled.nodes[0]?.params).toEqual({
      instances: 1,
      capacity: 100,
      serviceMs: 10,
    })
    expect(compiled.edges).toEqual([])
  })
})
