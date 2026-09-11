import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultParams } from '../model/catalog.ts'
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

beforeEach(resetStore)
afterEach(resetStore)

describe('worldStore params', () => {
  it('places machines with catalog defaults and undoes a param edit', () => {
    useWorldStore.setState({ stamp: 'rateLimiter' })
    useWorldStore.getState().placeAt({ x: 0, y: 0, z: 0 })
    const id = useWorldStore.getState().selectedMachineIds[0]
    if (!id) throw new Error('expected limiter')
    expect(useWorldStore.getState().world.machines[id]?.params).toEqual(
      defaultParams('rateLimiter'),
    )
    useWorldStore.getState().setSelectedParam('limitPerSec', 25)
    expect(useWorldStore.getState().world.machines[id]?.params?.limitPerSec).toBe(25)
    useWorldStore.getState().undo()
    expect(useWorldStore.getState().world.machines[id]?.params?.limitPerSec).toBe(100)
  })
})
