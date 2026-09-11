import { useMemo } from 'react'
import { create } from 'zustand'
import { compile } from '../compiler/compile.ts'
import { describeConnectError } from '../compiler/validate.ts'
import type { WorldMeta } from '../io/worldJson.ts'
import { defaultParams, hydrateLatency, hydrateParams, specOf } from '../model/catalog.ts'
import { nextRotation, occupancyMap } from '../model/geometry.ts'
import { createId } from '../model/ids.ts'
import { emptyWorld, sampleWorld } from '../model/sample.ts'
import type { MachineKind, ParamValue, PortRef, Vec3, World } from '../model/types.ts'
import {
  emptyHistory,
  record,
  redo as redoHistory,
  undo as undoHistory,
  type HistoryState,
} from './history.ts'

export type Stamp = MachineKind | null

type WorldStore = {
  world: World
  selectedMachineIds: string[]
  selectedPipeIds: string[]
  pendingPort: PortRef | null
  stamp: Stamp
  hoverCell: Vec3 | null
  connectError: string | null
  history: HistoryState
  frameToken: number
  documentName: string
  documentDescription: string
  setStamp: (stamp: Stamp) => void
  setHoverCell: (cell: Vec3 | null) => void
  select: (id: string | null, additive?: boolean) => void
  selectPipe: (id: string | null, additive?: boolean) => void
  placeAt: (cell: Vec3) => void
  clickPort: (ref: PortRef) => void
  rotateSelected: () => void
  deleteSelected: () => void
  renameSelected: (name: string) => void
  setSelectedParam: (paramId: string, value: ParamValue) => void
  setSelectedPipeLatency: (latencyMs: number) => void
  cancelPending: () => void
  undo: () => void
  redo: () => void
  frameBuild: () => void
  setDocumentMeta: (meta: WorldMeta) => void
  loadSample: () => void
  loadWorld: (world: World, meta?: WorldMeta) => void
  clear: () => void
}

function counts(world: World, kind: MachineKind): number {
  return Object.values(world.machines).filter((machine) => machine.kind === kind).length
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function clearSelection(): Pick<WorldStore, 'selectedMachineIds' | 'selectedPipeIds'> {
  return { selectedMachineIds: [], selectedPipeIds: [] }
}

function applyHistory(
  set: (partial: Partial<WorldStore>) => void,
  get: () => WorldStore,
  step: typeof undoHistory,
) {
  const { history, world, selectedMachineIds, selectedPipeIds } = get()
  const result = step(history, world)
  if (!result) return
  set({
    world: result.world,
    history: result.history,
    selectedMachineIds: selectedMachineIds.filter((id) => result.world.machines[id]),
    selectedPipeIds: selectedPipeIds.filter((id) => result.world.pipes[id]),
    pendingPort: null,
    connectError: null,
  })
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  world: emptyWorld(),
  selectedMachineIds: [],
  selectedPipeIds: [],
  pendingPort: null,
  stamp: 'service',
  hoverCell: null,
  connectError: null,
  history: emptyHistory(),
  frameToken: 0,
  documentName: '',
  documentDescription: '',

  setStamp: (stamp) => set({ stamp, pendingPort: null, connectError: null }),
  setHoverCell: (hoverCell) => set({ hoverCell }),
  select: (id, additive = false) => {
    if (id === null) {
      set({ ...clearSelection(), pendingPort: null, connectError: null })
      return
    }
    if (!additive) {
      set({
        selectedMachineIds: [id],
        selectedPipeIds: [],
        pendingPort: null,
        connectError: null,
      })
      return
    }
    set({
      selectedMachineIds: toggleId(get().selectedMachineIds, id),
      pendingPort: null,
      connectError: null,
    })
  },
  selectPipe: (id, additive = false) => {
    if (id === null) {
      set({ ...clearSelection(), pendingPort: null, connectError: null })
      return
    }
    if (!additive) {
      set({
        selectedPipeIds: [id],
        selectedMachineIds: [],
        pendingPort: null,
        connectError: null,
      })
      return
    }
    set({
      selectedPipeIds: toggleId(get().selectedPipeIds, id),
      pendingPort: null,
      connectError: null,
    })
  },

  placeAt: (cell) => {
    const { world, stamp, history } = get()
    const occupied = occupancyMap(Object.values(world.machines))
    const existing = occupied.get(`${cell.x},${cell.y},${cell.z}`)
    if (existing) {
      set({ selectedMachineIds: [existing], selectedPipeIds: [], pendingPort: null })
      return
    }
    if (!stamp) return
    const spec = specOf(stamp)
    const id = createId(stamp)
    const machine = {
      id,
      kind: stamp,
      name: `${spec.label} ${counts(world, stamp) + 1}`,
      position: { x: cell.x, y: 0, z: cell.z },
      rotation: 0 as const,
      params: defaultParams(stamp),
    }
    set({
      world: {
        ...world,
        machines: { ...world.machines, [id]: machine },
      },
      selectedMachineIds: [id],
      selectedPipeIds: [],
      pendingPort: null,
      connectError: null,
      history: record(history, world),
    })
  },

  clickPort: (ref) => {
    const { pendingPort, world } = get()
    if (!pendingPort) {
      set({
        pendingPort: ref,
        connectError: null,
        selectedMachineIds: [ref.machineId],
        selectedPipeIds: [],
        stamp: null,
      })
      return
    }
    if (
      pendingPort.machineId === ref.machineId &&
      pendingPort.portId === ref.portId
    ) {
      set({ pendingPort: null, connectError: null })
      return
    }
    const forward = describeConnectError(world, pendingPort, ref)
    const backward = describeConnectError(world, ref, pendingPort)
    const fromTo = !forward
      ? { from: pendingPort, to: ref }
      : !backward
        ? { from: ref, to: pendingPort }
        : null
    if (!fromTo) {
      set({ connectError: forward ?? backward, pendingPort: ref })
      return
    }
    const source = world.machines[fromTo.from.machineId]
    const sourcePort = specOf(source.kind).ports.find((port) => port.id === fromTo.from.portId)
    if (!sourcePort) return
    const id = createId('pipe')
    set({
      world: {
        ...world,
        pipes: {
          ...world.pipes,
          [id]: {
            id,
            from: fromTo.from,
            to: fromTo.to,
            channel: sourcePort.channel,
            latencyMs: 0,
          },
        },
      },
      pendingPort: null,
      connectError: null,
      selectedMachineIds: [fromTo.to.machineId],
      selectedPipeIds: [],
      history: record(get().history, world),
    })
  },

  rotateSelected: () => {
    const { selectedMachineIds, world, history } = get()
    const ids = selectedMachineIds.filter((id) => world.machines[id])
    if (ids.length === 0) return
    const machines = { ...world.machines }
    for (const id of ids) {
      const machine = machines[id]
      machines[id] = { ...machine, rotation: nextRotation(machine.rotation) }
    }
    set({
      world: { ...world, machines },
      history: record(history, world),
    })
  },

  deleteSelected: () => {
    const { selectedMachineIds, selectedPipeIds, world, history } = get()
    if (selectedMachineIds.length === 0 && selectedPipeIds.length === 0) return
    const removeMachines = new Set(selectedMachineIds)
    const removePipes = new Set(selectedPipeIds)
    const machines = { ...world.machines }
    for (const id of removeMachines) delete machines[id]
    const pipes = Object.fromEntries(
      Object.entries(world.pipes).filter(([, pipe]) => {
        if (removePipes.has(pipe.id)) return false
        if (removeMachines.has(pipe.from.machineId) || removeMachines.has(pipe.to.machineId)) {
          return false
        }
        return true
      }),
    )
    set({
      world: { machines, pipes },
      ...clearSelection(),
      pendingPort: null,
      history: record(history, world),
    })
  },

  renameSelected: (name) => {
    const { selectedMachineIds, world, history } = get()
    if (selectedMachineIds.length !== 1) return
    const selectedId = selectedMachineIds[0]
    const machine = world.machines[selectedId]
    if (!machine || machine.name === name) return
    set({
      world: {
        ...world,
        machines: {
          ...world.machines,
          [selectedId]: { ...machine, name },
        },
      },
      history: record(history, world),
    })
  },

  setSelectedParam: (paramId, value) => {
    const { selectedMachineIds, world, history } = get()
    if (selectedMachineIds.length !== 1) return
    const selectedId = selectedMachineIds[0]
    const machine = world.machines[selectedId]
    if (!machine) return
    const current = hydrateParams(machine.kind, machine.params)
    if (current[paramId] === value) return
    const spec = specOf(machine.kind).params.find((item) => item.id === paramId)
    if (!spec) return
    set({
      world: {
        ...world,
        machines: {
          ...world.machines,
          [selectedId]: {
            ...machine,
            params: hydrateParams(machine.kind, { ...current, [paramId]: value }),
          },
        },
      },
      history: record(history, world),
    })
  },

  setSelectedPipeLatency: (latencyMs) => {
    const { selectedPipeIds, world, history } = get()
    if (selectedPipeIds.length !== 1) return
    const selectedId = selectedPipeIds[0]
    const pipe = world.pipes[selectedId]
    if (!pipe) return
    const next = hydrateLatency(latencyMs)
    if (hydrateLatency(pipe.latencyMs) === next) return
    set({
      world: {
        ...world,
        pipes: {
          ...world.pipes,
          [selectedId]: { ...pipe, latencyMs: next },
        },
      },
      history: record(history, world),
    })
  },

  cancelPending: () => set({ pendingPort: null, connectError: null }),
  undo: () => applyHistory(set, get, undoHistory),
  redo: () => applyHistory(set, get, redoHistory),
  frameBuild: () => set({ frameToken: get().frameToken + 1 }),
  setDocumentMeta: (meta) =>
    set({
      documentName: meta.name ?? get().documentName,
      documentDescription: meta.description ?? get().documentDescription,
    }),
  loadSample: () =>
    set({
      world: sampleWorld(),
      ...clearSelection(),
      pendingPort: null,
      stamp: null,
      connectError: null,
      history: emptyHistory(),
      frameToken: get().frameToken + 1,
      documentName: 'Sample factory',
      documentDescription: '',
    }),
  loadWorld: (world, meta) =>
    set({
      world,
      ...clearSelection(),
      pendingPort: null,
      stamp: null,
      connectError: null,
      history: emptyHistory(),
      frameToken: get().frameToken + 1,
      documentName: meta?.name ?? '',
      documentDescription: meta?.description ?? '',
    }),
  clear: () =>
    set({
      world: emptyWorld(),
      ...clearSelection(),
      pendingPort: null,
      connectError: null,
      history: emptyHistory(),
      documentName: '',
      documentDescription: '',
    }),
}))

export function useCompiled() {
  const world = useWorldStore((state) => state.world)
  return useMemo(() => compile(world), [world])
}
