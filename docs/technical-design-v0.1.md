# Constructs V0.1 — Technical Design

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Vite + React 19 + TypeScript | Fast web tool loop; 2D diagram and chrome are DOM. |
| 3D | Three.js via React Three Fiber + Drei | Declarative scene, orbit/grid/lines included. |
| 2D diagram | `@xyflow/react` + `@dagrejs/dagre` | Live professional graph; sync layout. |
| State | Zustand | Tiny store over a single `World`. |
| Tests | Vitest | Pure compiler/validator tests, no canvas. |

Rejected for V0.1: Babylon, Godot, Bevy, voxel engines, elkjs, Mermaid-as-live-renderer, Zod (hand-written types are the schema for now).

React is pinned at 19.2.x because `@react-three/fiber@9` peers `<19.3`.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        UI chrome                         │
│  Palette │ Inspector │ Diagnostics │ Mermaid export      │
└─────────────┬───────────────────────────┬───────────────┘
              │ writes                    │ reads
              ▼                           ▼
        World store                  compile(world)
        (canonical)                  pure, no DOM
              │                           │
              ▼                           ▼
        3D scene (R3F)              CompiledSystem
        grid pose + meshes          nodes, edges,
                                    diagnostics, mermaid
                                          │
                                          ▼
                                    2D xyflow view
                                    (auto-layout only)
```

**Canonical data is `World`:** machines on a grid + pipes between ports.  
**Compiled data is `CompiledSystem`:** a directed typed graph plus diagnostics and exporters.

The 3D scene never invents topology. The 2D view never invents topology. Both read.

This is the bidirectionality hinge: a future importer writes `World` (and optionally seeds grid poses with a packer). A future simulator reads `CompiledSystem`.

## Data model

```ts
World {
  machines: Record<Id, Machine>
  pipes: Record<Id, Pipe>
}

Machine {
  id, kind, name
  position: { x: int, y: 0, z: int }
  rotation: 0 | 90 | 180 | 270   // yaw, 90° steps
}

Pipe {
  id
  from: { machineId, portId }
  to:   { machineId, portId }
  channel: 'request' | 'async' | 'data'
}

MachineSpec (catalog, not instance) {
  kind, label, color
  ports: PortSpec[]  // direction, channel, face, slot
}
```

Ports are not stored on instances. They live in the catalog and are transformed by instance rotation at use time. Adding a port to a kind never requires migrating saved instances.

**IDs are stable strings.** Compilers, 2D nodes, and a future sim snapshot all key off them.

Optional later fields (not required in V0.1 UI): `capacity`, `serviceMs` on machines; `bandwidth` / `latencyMs` on pipes. If present they must be ignored by the V0.1 compiler besides being passed through the compiled node payload.

## Compiler

`compile(world): CompiledSystem`

Steps:

1. Index machines; emit a node per machine (`id`, `kind`, `label`, `name`).
2. Resolve each pipe's ports through `rotatePort(spec, machine.rotation)`.
3. Validate; collect diagnostics.
4. Emit an edge per **valid** pipe. Invalid pipes stay in `World` (so the user can see/fix them) but are marked and **omitted from Mermaid/2D** so the diagram does not lie.
5. Render Mermaid from valid nodes/edges.
6. Produce dagre-friendly node/edge arrays for xyflow (layout is a view adapter, not part of `World`).

Validation codes:

| Code | Severity | Meaning |
|---|---|---|
| `OVERLAP` | error | Two machines share a cell |
| `TYPE_MISMATCH` | error | Pipe channel ≠ both ports' channel |
| `DIRECTION_INVALID` | error | Not an out→in pair |
| `DANGLING_PORT_REF` | error | Pipe points at missing machine/port |
| `SELF_PIPE` | error | Machine connected to itself (V0.1 forbids) |
| `DISCONNECTED` | warning | Machine has zero valid pipes |
| `UNUSED_INPUT` | warning | Required input port has no valid pipe |

`compile` must be deterministic for a given `World` (sort IDs).

## 3D scene

- Cell size 1.75 world units. Machines are ~1.15×0.9×1.15 boxes.
- Invisible `y = 0` plane for placement raycasts.
- Ports are small spheres/capsules on faces; slot index offsets multiple ports on one face.
- Pipes: quadratic bezier tubes, color by channel.
- Controls: OrbitControls, no underground camera, grid from Drei.
- Input:
  - Empty cell + active palette kind → place
  - Machine body → select
  - Port → if another port is pending, try connect; else set pending
  - `R` rotate selected, `Delete` remove selected, `Esc` cancel pending port

No physics. No character controller. No voxel meshing.

## 2D diagram

xyflow in a side panel, `fitView` on compile. Nodes are not draggable in V0.1 (prevents a second source of truth). Edges labeled with channel. Node chrome uses catalog colors.

Layout: dagre LR. Re-run on every compile. Jumping layout is acceptable in V0.1; pinning positions is a V0.2 view-state feature.

## Project structure

```
src/
  model/        types, catalog, geometry, sample world, ids
  compiler/     compile, validate, mermaid, diagram adapter
  store/        zustand world store
  scene/        R3F canvas, machines, pipes, placement
  diagram/      xyflow panel
  ui/           shell, palette, inspector, diagnostics, mermaid
  App.tsx
```

Tests live next to compiler (`compile.test.ts`). They must not import React or Three.

## Milestones

Already in this repo as the vertical slice:

- M0 — model + catalog + compile + validate + mermaid
- M1 — zustand world + sample topology
- M2 — 3D place / rotate / connect
- M3 — live xyflow + diagnostics + mermaid panel
- M4 — file save/load of versioned `constructs.world` JSON
- M5 — Structurizr DSL exporter (container view)

Next:

See [roadmap.md](./roadmap.md) for the full sequence (V0.2 usability → V0.3 sim-ready catalog → V0.4 DES → V0.5 scenarios → V0.6 import). Do not start M7/M8 until V0.2 is done.

- M6 — elkjs orthogonal edges; pipe auto-route on grid (V0.2)
- M7 — `sim/` worker reading `CompiledSystem` (V0.4)
- M8 — Structurizr dialect import + packer (V0.6)

## V0.1 risks and mitigations

| Risk | Mitigation |
|---|---|
| R3F × React 19 peer range | Pin `react@19.2.8` |
| 3D click vs orbit | Use mesh `onClick`; pending-port is explicit; Esc cancels |
| Dagre layout thrash | Accept in V0.1; IDs keep node identity |
| Users expect belts with moving items | Ports + colored pipes only; copy in the inspector explains channels |
| `verbatimModuleSyntax` / no enums | Union string types; `import type` |

## Open questions (do not block V0.1)

1. Should unused invalid pipes be deleted automatically or kept as red ghosts in 3D?
   **V0.1 answer:** refused at connect time when detectable; if catalog changes later, they remain as error diagnostics.
2. Is a Service allowed to call another Service on `request`? **Yes.**
3. Multiple edges between the same pair (request + async)? **Yes, different ports.**
4. Name of the public product vs repo `constructs`? Unresolved; ship as Constructs.
