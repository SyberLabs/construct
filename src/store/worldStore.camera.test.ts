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
    frameToken: 0,
  })
}

beforeEach(resetStore)
afterEach(resetStore)

describe('worldStore camera', () => {
  it('bumps frameToken on frameBuild, loadSample, and loadWorld', () => {
    expect(useWorldStore.getState().frameToken).toBe(0)
    useWorldStore.getState().frameBuild()
    expect(useWorldStore.getState().frameToken).toBe(1)
    useWorldStore.getState().loadSample()
    expect(useWorldStore.getState().frameToken).toBe(2)
    useWorldStore.getState().loadWorld(emptyWorld())
    expect(useWorldStore.getState().frameToken).toBe(3)
  })
})
