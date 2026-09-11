import { Html } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import { CurvePath, LineCurve3, TubeGeometry, Vector3 } from 'three'
import { isCompatiblePort } from '../compiler/validate.ts'
import { CHANNEL_COLORS, portSpec, specOf } from '../model/catalog.ts'
import {
  CELL,
  MACHINE_H,
  MACHINE_W,
  PORT_PICK_RADIUS,
  PORT_RADIUS,
  portWorldPosition,
} from '../model/geometry.ts'
import { orthogonalPipePoints } from '../model/pipePath.ts'
import type { Machine, Pipe } from '../model/types.ts'
import { useWorldStore } from '../store/worldStore.ts'

type MachineMeshProps = {
  machine: Machine
}

export function MachineMesh({ machine }: MachineMeshProps) {
  const spec = specOf(machine.kind)
  const selected = useWorldStore((state) =>
    state.selectedMachineIds.includes(machine.id),
  )
  const pendingPort = useWorldStore((state) => state.pendingPort)
  const world = useWorldStore((state) => state.world)
  const select = useWorldStore((state) => state.select)
  const clickPort = useWorldStore((state) => state.clickPort)
  const originY = MACHINE_H / 2

  return (
    <group
      position={[machine.position.x * CELL, 0, machine.position.z * CELL]}
      rotation={[0, (machine.rotation * Math.PI) / 180, 0]}
    >
      <mesh
        position={[0, originY, 0]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation()
          select(machine.id, event.shiftKey)
        }}
      >
        <boxGeometry args={[MACHINE_W, MACHINE_H, MACHINE_W]} />
        <meshStandardMaterial
          color={spec.color}
          roughness={0.38}
          metalness={0.22}
          emissive={spec.color}
          emissiveIntensity={selected ? 0.22 : 0.05}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[MACHINE_W + 0.12, 0.08, MACHINE_W + 0.12]} />
        <meshStandardMaterial color="#1b212c" roughness={0.8} />
      </mesh>
      <Html
        position={[0, MACHINE_H + 0.28, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="machine-tag">
          <span>{spec.short}</span>
          {machine.name}
        </div>
      </Html>
      {spec.ports.map((port) => {
        const local = portWorldPosition(
          { ...machine, position: { x: 0, y: 0, z: 0 }, rotation: 0 },
          port,
        )
        const ref = { machineId: machine.id, portId: port.id }
        const pending =
          pendingPort?.machineId === machine.id && pendingPort.portId === port.id
        const compatible = Boolean(
          pendingPort && isCompatiblePort(world, pendingPort, ref),
        )
        const visualRadius = pending
          ? PORT_RADIUS * 1.45
          : compatible
            ? PORT_RADIUS * 1.28
            : PORT_RADIUS
        return (
          <group key={port.id} position={[local.x, local.y, local.z]}>
            <mesh
              visible={false}
              onClick={(event) => {
                event.stopPropagation()
                clickPort(ref)
              }}
            >
              <sphereGeometry args={[PORT_PICK_RADIUS, 12, 12]} />
            </mesh>
            <mesh raycast={() => {}}>
              <sphereGeometry args={[visualRadius, 16, 16]} />
              <meshStandardMaterial
                color={CHANNEL_COLORS[port.channel]}
                emissive={CHANNEL_COLORS[port.channel]}
                emissiveIntensity={pending ? 1.35 : compatible ? 1.05 : 0.55}
                roughness={0.25}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

type PipeMeshProps = {
  pipe: Pipe
  machines: Record<string, Machine>
}

export function PipeMesh({ pipe, machines }: PipeMeshProps) {
  const fromMachine = machines[pipe.from.machineId]
  const toMachine = machines[pipe.to.machineId]
  const selected = useWorldStore((state) => state.selectedPipeIds.includes(pipe.id))
  const selectPipe = useWorldStore((state) => state.selectPipe)
  const fromPort = fromMachine
    ? portSpec(fromMachine.kind, pipe.from.portId)
    : undefined
  const toPort = toMachine ? portSpec(toMachine.kind, pipe.to.portId) : undefined
  const start = fromMachine && fromPort ? portWorldPosition(fromMachine, fromPort) : null
  const end = toMachine && toPort ? portWorldPosition(toMachine, toPort) : null

  const geometry = useMemo(() => {
    if (!start || !end || !fromMachine || !toMachine) return null
    const occupied = Object.values(machines)
      .filter((machine) => machine.id !== fromMachine.id && machine.id !== toMachine.id)
      .map((machine) => machine.position)
    const points = orthogonalPipePoints(start, end, occupied, [
      fromMachine.position,
      toMachine.position,
    ])
    if (points.length < 2) return null
    const path = new CurvePath<Vector3>()
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      if (!a || !b) continue
      path.add(
        new LineCurve3(new Vector3(a.x, a.y, a.z), new Vector3(b.x, b.y, b.z)),
      )
    }
    if (path.curves.length === 0) return null
    return new TubeGeometry(path, Math.max(12, points.length * 10), selected ? 0.07 : 0.048, 6, false)
  }, [start?.x, start?.y, start?.z, end?.x, end?.y, end?.z, selected, machines, fromMachine, toMachine])

  useLayoutEffect(() => {
    return () => {
      geometry?.dispose()
    }
  }, [geometry])

  if (!geometry) return null

  return (
    <mesh
      geometry={geometry}
      onClick={(event) => {
        event.stopPropagation()
        selectPipe(pipe.id, event.shiftKey)
      }}
    >
      <meshStandardMaterial
        color={CHANNEL_COLORS[pipe.channel]}
        emissive={CHANNEL_COLORS[pipe.channel]}
        emissiveIntensity={selected ? 0.9 : 0.22}
        roughness={0.35}
        metalness={0.12}
      />
    </mesh>
  )
}
