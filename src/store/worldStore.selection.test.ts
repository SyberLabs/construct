import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { emptyWorld } from '../model/sample.ts'
import { emptyHistory } from './history.ts'
import { useWorldStore } from './worldStore.ts'

function resetStore() {
  useWorldStore.setState({
    world: emptyWorld(),
    selectedMachineIds: [],
    selectedPipeIds: [],
    pendingPort: null,
    stamp: 'service',
    hoverCell: null,
    connectError: null,
    history: emptyHistory(),
  })
}

function place(kind: 'service' | 'cache', x: number, z: number): string {
  useWorldStore.setState({ stamp: kind })
  useWorldStore.getState().placeAt({ x, y: 0, z })
  const id = useWorldStore.getState().selectedMachineIds[0]
  if (!id) throw new Error('expected a placed machine to be selected')
  return id
}

function connect(fromId: string, fromPort: string, toId: string, toPort: string): string {
  useWorldStore.getState().clickPort({ machineId: fromId, portId: fromPort })
  useWorldStore.getState().clickPort({ machineId: toId, portId: toPort })
  const pipeId = Object.keys(useWorldStore.getState().world.pipes)[0]
  if (!pipeId) throw new Error('expected a pipe')
  return pipeId
}

beforeEach(resetStore)
afterEach(resetStore)

describe('worldStore selection', () => {
  it('selects a pipe and delete removes only that pipe', () => {
    const serviceId = place('service', 0, 0)
    const cacheId = place('cache', 2, 0)
    const pipeId = connect(serviceId, 'store', cacheId, 'in')
    useWorldStore.getState().selectPipe(pipeId)
    expect(useWorldStore.getState().selectedPipeIds).toEqual([pipeId])
    expect(useWorldStore.getState().selectedMachineIds).toEqual([])
    useWorldStore.getState().deleteSelected()
    expect(useWorldStore.getState().world.pipes).toEqual({})
    expect(Object.keys(useWorldStore.getState().world.machines).sort()).toEqual(
      [cacheId, serviceId].sort(),
    )
  })

  it('shift-selects two machines and delete removes both and their pipes', () => {
    const a = place('service', 0, 0)
    const b = place('cache', 2, 0)
    connect(a, 'store', b, 'in')
    useWorldStore.getState().select(a)
    useWorldStore.getState().select(b, true)
    expect(useWorldStore.getState().selectedMachineIds).toEqual([a, b])
    useWorldStore.getState().deleteSelected()
    expect(useWorldStore.getState().world).toEqual(emptyWorld())
  })

  it('selecting a pipe does not record history', () => {
    const serviceId = place('service', 0, 0)
    const cacheId = place('cache', 2, 0)
    const pipeId = connect(serviceId, 'store', cacheId, 'in')
    const past = useWorldStore.getState().history.past.length
    useWorldStore.getState().selectPipe(pipeId)
    expect(useWorldStore.getState().history.past).toHaveLength(past)
  })

  it('undo restores a deleted pipe', () => {
    const serviceId = place('service', 0, 0)
    const cacheId = place('cache', 2, 0)
    const pipeId = connect(serviceId, 'store', cacheId, 'in')
    useWorldStore.getState().selectPipe(pipeId)
    useWorldStore.getState().deleteSelected()
    useWorldStore.getState().undo()
    expect(useWorldStore.getState().world.pipes[pipeId]).toBeDefined()
  })
})
