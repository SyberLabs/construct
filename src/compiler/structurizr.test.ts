import { describe, expect, it } from 'vitest'
import { compile } from './compile.ts'
import { emptyWorld, sampleWorld } from '../model/sample.ts'
import type { World } from '../model/types.ts'

describe('structurizr export', () => {
  it('emits an empty workspace for an empty factory', () => {
    const dsl = compile(emptyWorld()).structurizr
    expect(dsl).toContain('workspace')
    expect(dsl).toContain('softwareSystem')
    expect(dsl).toContain('container factory')
    expect(dsl).toContain('autoLayout lr')
    expect(dsl).not.toContain('container "')
  })

  it('maps sample machines to containers and valid pipes to relationships', () => {
    const compiled = compile(sampleWorld())
    expect(compiled.structurizr).toContain('workspace "Constructs"')
    expect(compiled.structurizr).toContain('container factory "containers"')
    for (const node of compiled.nodes) {
      expect(compiled.structurizr).toContain(node.name)
      expect(compiled.structurizr).toContain(`"constructs.kind" "${node.kind}"`)
    }
    expect(compiled.structurizr).toMatch(/-> .* "request" "HTTP\/RPC"/)
    expect(compiled.structurizr).toMatch(/-> .* "async" "async messaging"/)
    expect(compiled.structurizr).toMatch(/-> .* "data" "data access"/)
    expect(compiled.structurizr).toContain('"constructs.fromPort"')
    expect(compiled.structurizr).toContain('"constructs.x"')
  })

  it('omits type-mismatched pipes from the DSL', () => {
    const world: World = {
      machines: {
        client: {
          id: 'client',
          kind: 'client',
          name: 'web',
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
      pipes: {
        bad: {
          id: 'bad',
          from: { machineId: 'client', portId: 'out' },
          to: { machineId: 'db', portId: 'in' },
          channel: 'request',
        },
      },
    }
    const dsl = compile(world).structurizr
    expect(dsl).toContain('web')
    expect(dsl).toContain('db')
    expect(dsl).not.toContain('->')
  })
})
