import { describe, expect, it } from 'vitest'
import { sampleWorld } from '../model/sample.ts'
import type { World } from '../model/types.ts'
import { compile } from './compile.ts'
import { layoutDiagram, topologyKey } from './diagram.ts'

describe('diagram layout', () => {
  it('keeps topologyKey stable across rename and rotate', () => {
    const world = sampleWorld()
    const first = topologyKey(compile(world))
    const machine = Object.values(world.machines)[0]
    if (!machine) throw new Error('expected sample machines')
    const renamed: World = {
      ...world,
      machines: {
        ...world.machines,
        [machine.id]: { ...machine, name: 'renamed-machine' },
      },
    }
    expect(topologyKey(compile(renamed))).toBe(first)
  })

  it('lays the sample out left-to-right', async () => {
    const compiled = compile(sampleWorld())
    const { nodes, edges } = await layoutDiagram(compiled)
    expect(nodes).toHaveLength(9)
    expect(edges).toHaveLength(8)
    const byKind = (kind: string) => {
      const id = compiled.nodes.find((node) => node.kind === kind)?.id
      return nodes.find((node) => node.id === id)
    }
    const client = byKind('client')
    const queue = byKind('queue')
    expect(client).toBeDefined()
    expect(queue).toBeDefined()
    if (!client || !queue) return
    expect(client.position.x).toBeLessThan(queue.position.x)
  })
})
