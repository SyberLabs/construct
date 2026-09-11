import { Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { frameCameraPose, occupiedBounds } from '../model/bounds.ts'
import { specOf } from '../model/catalog.ts'
import { CELL, occupancyMap, worldToGrid } from '../model/geometry.ts'
import { useWorldStore } from '../store/worldStore.ts'
import { MachineMesh, PipeMesh } from './MachineMesh.tsx'

function Floor() {
  const stamp = useWorldStore((state) => state.stamp)
  const placeAt = useWorldStore((state) => state.placeAt)
  const setHoverCell = useWorldStore((state) => state.setHoverCell)
  const select = useWorldStore((state) => state.select)

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerMove={(event) => {
        setHoverCell(worldToGrid({ x: event.point.x, y: 0, z: event.point.z }))
      }}
      onPointerOut={() => setHoverCell(null)}
      onClick={(event) => {
        event.stopPropagation()
        if (!stamp) {
          select(null)
          return
        }
        placeAt(worldToGrid({ x: event.point.x, y: 0, z: event.point.z }))
      }}
    >
      <planeGeometry args={[64, 64]} />
      <meshStandardMaterial color="#1a2230" roughness={0.92} metalness={0.08} />
    </mesh>
  )
}

function Ghost() {
  const stamp = useWorldStore((state) => state.stamp)
  const hoverCell = useWorldStore((state) => state.hoverCell)
  const world = useWorldStore((state) => state.world)
  if (!stamp || !hoverCell) return null
  const occupied = occupancyMap(Object.values(world.machines))
  if (occupied.has(`${hoverCell.x},${hoverCell.y},${hoverCell.z}`)) return null
  const spec = specOf(stamp)
  return (
    <mesh
      position={[hoverCell.x * CELL, 0.46, hoverCell.z * CELL]}
      raycast={() => {}}
    >
      <boxGeometry args={[1.12, 0.92, 1.12]} />
      <meshStandardMaterial
        color={spec.color}
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </mesh>
  )
}

function FrameCamera({
  controlsRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>
}) {
  const frameToken = useWorldStore((state) => state.frameToken)
  const machines = useWorldStore((state) => state.world.machines)

  useLayoutEffect(() => {
    const controls = controlsRef.current
    if (!frameToken || !controls) return
    const bounds = occupiedBounds(Object.values(machines))
    if (!bounds) return
    const pose = frameCameraPose(bounds)
    controls.object.position.set(pose.position.x, pose.position.y, pose.position.z)
    controls.target.set(pose.target.x, pose.target.y, pose.target.z)
    controls.update()
  }, [controlsRef, frameToken, machines])

  return null
}

export function WorldCanvas() {
  const world = useWorldStore((state) => state.world)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <Canvas
      shadows
      camera={{ position: [9, 11, 11], fov: 42, near: 0.1, far: 80 }}
      onPointerMissed={() => useWorldStore.getState().select(null)}
    >
      <color attach="background" args={['#0b0d12']} />
      <fog attach="fog" args={['#0b0d12', 22, 46]} />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={['#c5d4e8', '#161820', 0.45]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Floor />
      <Grid
        infiniteGrid
        fadeDistance={32}
        fadeStrength={0.6}
        sectionColor="#6d829c"
        cellColor="#3d4d61"
        sectionSize={CELL}
        cellSize={CELL}
        position={[0, 0.012, 0]}
      />
      <Ghost />
      {Object.values(world.machines).map((machine) => (
        <MachineMesh key={machine.id} machine={machine} />
      ))}
      {Object.values(world.pipes).map((pipe) => (
        <PipeMesh key={pipe.id} pipe={pipe} machines={world.machines} />
      ))}
      <FrameCamera controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        maxPolarAngle={Math.PI / 2.15}
        minDistance={5}
        maxDistance={48}
        enableDamping
      />
    </Canvas>
  )
}
