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

function machineIds(): string[] {
  return Object.keys(useWorldStore.getState().world.machines)
}

function pipeCount(): number {
  return Object.keys(useWorldStore.getState().world.pipes).length
}

function placeService(x: number, z: number): string {
  useWorldStore.setState({ stamp: 'service' })
  useWorldStore.getState().placeAt({ x, y: 0, z })
  const id = useWorldStore.getState().selectedMachineIds[0]
  if (!id) throw new Error('expected a placed machine to be selected')
  return id
}

beforeEach(resetStore)
afterEach(resetStore)

describe('worldStore history', () => {
  it('undo place restores the empty world', () => {
    placeService(0, 0)
    expect(machineIds()).toHaveLength(1)
    useWorldStore.getState().undo()
    expect(useWorldStore.getState().world).toEqual(emptyWorld())
    expect(useWorldStore.getState().history.past).toHaveLength(0)
  })

  it('redo place restores the machine', () => {
    const id = placeService(1, 2)
    useWorldStore.getState().undo()
    useWorldStore.getState().redo()
    expect(useWorldStore.getState().world.machines[id]?.position).toEqual({
      x: 1,
      y: 0,
      z: 2,
    })
  })

  it('undo connect removes the pipe', () => {
    const serviceId = placeService(0, 0)
    useWorldStore.setState({ stamp: 'cache' })
    useWorldStore.getState().placeAt({ x: 2, y: 0, z: 0 })
    const cacheId = useWorldStore.getState().selectedMachineIds[0]
    if (!cacheId) throw new Error('expected cache')
    useWorldStore.getState().clickPort({ machineId: serviceId, portId: 'store' })
    useWorldStore.getState().clickPort({ machineId: cacheId, portId: 'in' })
    expect(pipeCount()).toBe(1)
    useWorldStore.getState().undo()
    expect(pipeCount()).toBe(0)
    expect(machineIds()).toHaveLength(2)
  })

  it('undo rename restores the previous name', () => {
    const id = placeService(0, 0)
    useWorldStore.getState().renameSelected('api-v2')
    expect(useWorldStore.getState().world.machines[id]?.name).toBe('api-v2')
    useWorldStore.getState().undo()
    expect(useWorldStore.getState().world.machines[id]?.name).toBe('Service 1')
  })

  it('load sample clears the stack', () => {
    placeService(0, 0)
    expect(useWorldStore.getState().history.past.length).toBeGreaterThan(0)
    useWorldStore.getState().loadSample()
    expect(useWorldStore.getState().history).toEqual(emptyHistory())
    const afterLoad = useWorldStore.getState().world
    useWorldStore.getState().undo()
    expect(useWorldStore.getState().world).toEqual(afterLoad)
  })

  it('does not record selection or a failed connect', () => {
    const serviceId = placeService(0, 0)
    const afterPlace = useWorldStore.getState().history.past.length
    useWorldStore.getState().select(null)
    useWorldStore.getState().placeAt({ x: 0, y: 0, z: 0 })
    useWorldStore.getState().clickPort({ machineId: serviceId, portId: 'in' })
    useWorldStore.getState().clickPort({ machineId: serviceId, portId: 'out' })
    expect(useWorldStore.getState().history.past).toHaveLength(afterPlace)
    expect(pipeCount()).toBe(0)
  })
})
