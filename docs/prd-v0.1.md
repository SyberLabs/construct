# Constructs V0.1 — Product Requirements

**Codename:** Constructs  
**Version:** 0.1  
**Status:** Implementation started  
**One-sentence goal:** A user can stamp machines on a 3D factory floor, connect typed ports, and immediately get a correct 2D system diagram plus Mermaid.

## Problem

System design is done in 2D boxes (slow to feel, easy to fake) or in factory games (tactile, teaches the wrong artifacts). No tool lets you *build* a system with your hands and *compile* it into a diagram you would put in a design doc.

## Insight to prove

> I can construct a system in a 3D modular factory-like environment and immediately get a correct, useful 2D system-design diagram out of it.

If that sentence is false after V0.1, stop. Do not add simulation, import, or more machine kinds until it is true.

## Users

1. **Primary:** engineers learning or practicing system design (interview prep, courses, internal enablement).
2. **Secondary:** staff engineers drafting a first-pass architecture they will paste into a doc.

V0.1 is a single-player browser tool. No accounts.

## Success criteria (must all be true)

1. A new user can place at least two machines and connect them in under 60 seconds without a tutorial wall.
2. Every valid 3D connection appears as a labeled edge on the 2D diagram within one frame of the drop.
3. Invalid connections (channel mismatch, in→in, occupied cell) are rejected or flagged; the 2D diagram never shows a lie.
4. Mermaid export of a sample “client → LB → service → cache/db + queue” graph pastes into GitHub/Notion and renders.
5. The 3D view feels like a tiny factory floor (grid, sided ports, colored conduits), not a UML tool with perspective turned on.

## In scope

### Machines (6)

| Kind | Role | Ports (V0.1) |
|---|---|---|
| Client | External origin of requests | `request` out |
| Load balancer | Fan-in / fan-out of sync calls | `request` in, `request` out |
| Service | Compute | `request` in/out, `async` in/out, `data` out |
| Queue | Durable async buffer | `async` in, `async` out |
| Cache | Fast data | `data` in |
| Database | Durable data | `data` in |

### Channels / pipes (3)

- `request` — synchronous call (HTTP/RPC)
- `async` — message / job
- `data` — cache or database access

Pipes run **output port → input port** of the same channel. They are first-class graph edges, not decorations.

### Spatial construction

- Integer grid on a single floor (`y = 0`).
- Place, select, rotate (90° yaw), delete.
- Ports sit on machine faces and rotate with the machine.
- Click two compatible ports to connect. Orthogonal-looking tubes in 3D.

### Live compilation

- Canonical world model → compiled system graph on every edit.
- Live 2D diagram (auto-layout, not a screenshot of the 3D camera).
- Mermaid flowchart export (copyable).
- Diagnostics: overlap, type mismatch, bad direction, disconnected machine, unused required input.

### Visual bar

- Dark industrial floor, readable machine colors, glowing ports, distinct pipe colors per channel.
- Split workspace: 3D canvas dominant, 2D diagram + diagnostics + Mermaid on the side.
- Palette + inspector.

### Extension points (interfaces only, no behavior)

- Stable machine/pipe IDs.
- Optional unused fields on nodes for later sim: `capacity`, `serviceMs` (may be omitted from UI).
- `compile()` is a pure function with no DOM.
- View state (grid pose vs diagram pose) is stored separately from graph semantics.

## Out of scope for V0.1

- Discrete-event simulation, particles, load sliders, failure injection
- 2D → 3D import or Structurizr/Mermaid import
- Voxel terrain, mining, resources, power, recipes
- Stacking on Y, multiblock machines, belts with items
- C4 nested containers / people / deployment views
- PlantUML, Terraform, cloud-icon packs
- Multiplayer, auth, backend, collaboration
- VR/AR
- Auto-router that avoids collisions
- Persistence beyond the current session (no requirement to save files)
- Mobile layout
- Animation of “requests” moving through pipes

## UX principles

1. The 3D world is an **editor**, not a visualization of some other document.
2. The 2D diagram is a **compiler output**. Users do not drag 2D nodes in V0.1.
3. If the 3D build is invalid, say so in diagnostics; do not silently drop edges.
4. One click = one intent. No modal toolbars nested three deep.
5. Factory grammar over Minecraft grammar: machines and pipes, not dirt and pickaxes.

## Sample scenario (acceptance walkthrough)

1. Open the app. Floor grid is empty. Palette shows six machines.
2. Click **Load sample** (or stamp): Client, LB, Service, Cache, Database, Queue, Worker service.
3. 2D diagram shows the same topology with channel-labeled edges.
4. Mermaid panel shows a flowchart that matches.
5. Disconnect the database pipe → 2D edge disappears; a warning appears that the service data port or DB is unused.
6. Try to connect a `request` port to a `data` port → connection is refused with a type-mismatch diagnostic.

## Non-goals disguised as polish

Do not add: particle dust, day/night cycle, character controller, first-person mode, sound, achievements, or a marketplace of machine packs.
