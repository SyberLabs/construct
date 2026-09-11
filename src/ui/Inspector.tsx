import { useEffect, useState } from 'react'
import { hydrateLatency, hydrateParams, specOf } from '../model/catalog.ts'
import { useWorldStore } from '../store/worldStore.ts'

export function Inspector() {
  const selectedMachineIds = useWorldStore((state) => state.selectedMachineIds)
  const selectedPipeIds = useWorldStore((state) => state.selectedPipeIds)
  const world = useWorldStore((state) => state.world)
  const pendingPort = useWorldStore((state) => state.pendingPort)
  const connectError = useWorldStore((state) => state.connectError)
  const renameSelected = useWorldStore((state) => state.renameSelected)
  const rotateSelected = useWorldStore((state) => state.rotateSelected)
  const deleteSelected = useWorldStore((state) => state.deleteSelected)
  const setSelectedParam = useWorldStore((state) => state.setSelectedParam)
  const setSelectedPipeLatency = useWorldStore((state) => state.setSelectedPipeLatency)
  const machine =
    selectedMachineIds.length === 1 ? world.machines[selectedMachineIds[0]] : undefined
  const pipe =
    selectedPipeIds.length === 1 && selectedMachineIds.length === 0
      ? world.pipes[selectedPipeIds[0]]
      : undefined
  const [draftName, setDraftName] = useState('')
  const [draftParams, setDraftParams] = useState<Record<string, string>>({})
  const [draftLatency, setDraftLatency] = useState('0')

  useEffect(() => {
    setDraftName(machine?.name ?? '')
    if (!machine) {
      setDraftParams({})
      return
    }
    const values = hydrateParams(machine.kind, machine.params)
    setDraftParams(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, String(value)]),
      ),
    )
  }, [machine?.id, machine?.params, machine?.name])

  useEffect(() => {
    setDraftLatency(String(hydrateLatency(pipe?.latencyMs)))
  }, [pipe?.id, pipe?.latencyMs])

  if (selectedMachineIds.length + selectedPipeIds.length > 1) {
    return (
      <div className="inspector">
        <h2>Inspector</h2>
        <p>
          {selectedMachineIds.length} machine{selectedMachineIds.length === 1 ? '' : 's'},{' '}
          {selectedPipeIds.length} pipe{selectedPipeIds.length === 1 ? '' : 's'} selected.
        </p>
        {connectError ? <p className="error">{connectError}</p> : null}
        <div className="row">
          {selectedMachineIds.length > 0 ? (
            <button type="button" onClick={rotateSelected}>
              Rotate
            </button>
          ) : null}
          <button type="button" className="danger" onClick={deleteSelected}>
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (pipe) {
    const from = world.machines[pipe.from.machineId]
    const to = world.machines[pipe.to.machineId]
    return (
      <div className="inspector">
        <h2>Inspector</h2>
        <p>{pipe.channel} pipe</p>
        <p className="muted">
          {from?.name ?? pipe.from.machineId}:{pipe.from.portId} →{' '}
          {to?.name ?? pipe.to.machineId}:{pipe.to.portId}
        </p>
        <label>
          Latency ms
          <input
            type="number"
            min={0}
            step={1}
            value={draftLatency}
            onChange={(event) => setDraftLatency(event.target.value)}
            onBlur={() => {
              const next = Number(draftLatency)
              if (!Number.isFinite(next)) {
                setDraftLatency(String(hydrateLatency(pipe.latencyMs)))
                return
              }
              setSelectedPipeLatency(next)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </label>
        {connectError ? <p className="error">{connectError}</p> : null}
        <div className="row">
          <button type="button" className="danger" onClick={deleteSelected}>
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="inspector">
        <h2>Inspector</h2>
        <p className="muted">Select a machine or pipe to inspect or delete.</p>
        {pendingPort ? (
          <p>Pending port: {pendingPort.machineId}:{pendingPort.portId}</p>
        ) : null}
        {connectError ? <p className="error">{connectError}</p> : null}
      </div>
    )
  }

  const spec = specOf(machine.kind)
  const params = hydrateParams(machine.kind, machine.params)

  return (
    <div className="inspector">
      <h2>Inspector</h2>
      <label>
        Name
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => {
            if (draftName !== machine.name) renameSelected(draftName)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </label>
      <p className="muted">
        {spec.label} · yaw {machine.rotation}° · cell {machine.position.x},
        {machine.position.z}
      </p>
      {spec.params.length > 0 ? (
        <div className="param-list">
          {spec.params.map((param) =>
            param.kind === 'boolean' ? (
              <label key={param.id} className="check">
                <input
                  type="checkbox"
                  checked={Boolean(params[param.id])}
                  onChange={(event) => setSelectedParam(param.id, event.target.checked)}
                />
                {param.label}
              </label>
            ) : (
              <label key={param.id}>
                {param.label}
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={draftParams[param.id] ?? String(params[param.id])}
                  onChange={(event) =>
                    setDraftParams((current) => ({
                      ...current,
                      [param.id]: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    const next = Number(draftParams[param.id])
                    if (!Number.isFinite(next)) {
                      setDraftParams((current) => ({
                        ...current,
                        [param.id]: String(params[param.id]),
                      }))
                      return
                    }
                    setSelectedParam(param.id, next)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                />
              </label>
            ),
          )}
        </div>
      ) : null}
      <ul className="ports">
        {spec.ports.map((port) => (
          <li key={port.id}>
            <b>{port.direction}</b> {port.label} · {port.channel}
          </li>
        ))}
      </ul>
      {pendingPort ? (
        <p>
          Wiring from {pendingPort.portId}
          {pendingPort.machineId === machine.id ? ' on this machine' : ''}.
        </p>
      ) : null}
      {connectError ? <p className="error">{connectError}</p> : null}
      <div className="row">
        <button type="button" onClick={rotateSelected}>
          Rotate
        </button>
        <button type="button" className="danger" onClick={deleteSelected}>
          Delete
        </button>
      </div>
    </div>
  )
}
