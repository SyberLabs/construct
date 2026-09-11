# Constructs — Implementation Roadmap

**Date:** 2026-09-10  
**Audience:** the person (or agent) who will build the next slice  
**Rule:** each version proves one insight. If the insight is false, stop. Do not stack features to look busy.

The graph is the product. The 3D scene is an editor for the graph. The 2D diagram and architecture-as-code are compiler outputs. Simulation reads the compiled graph. Import writes the graph. Anything that violates that split is a rewrite, not a feature.

---

## 1. What is already true (V0.1)

Shipped in this repo:

- Six machines, three channels, grid place / rotate / connect
- Pure `compile(world)` → diagnostics + xyflow + Mermaid + Structurizr DSL
- Versioned `constructs.world` JSON save/load with stable IDs
- Browser-only, no accounts

**Insight proved:** you can construct a system on a factory floor and get a correct 2D diagram out of it.

V0.1 is a vertical slice, not a tool people will live in. V0.2 shipped the editor loop (undo, pipe select, port picking, orthogonal pipes, framing, elk layout, named JSON + autosave). The kill gate is still usage: if people cannot keep a topology in their head, or still mis-click ports more than they connect them, do not add machines or simulation. Fix the editor.

Do not start simulation, import, or a backend until the factory is something you would actually build a system in.

---

## 2. Sequencing rules

Apply in this order. Skipping a step creates debt.

1. **Question the requirement.** Who is the named user? If the answer is “everyone” or “enterprises,” delete it.
2. **Delete.** Voxel terrain, multiplayer, AWS live-scan, VR, Terraform generation, a machine marketplace, and accounts are not on this roadmap. If a later version wants one of them, it has to re-earn its place.
3. **Simplify the loop you already have** before adding a new loop.
4. **Accelerate** construction (undo, routing, framing) only on that cleaned loop.
5. **Automate last** (share URLs, git hooks, CI export). Never automate a factory people cannot steer.

**Trunk (do not fork):** `World` JSON v1 → `compile()` → views.

| View | Role | May write `World`? |
|---|---|---|
| 3D factory | Primary editor | Yes |
| 2D diagram | Compiler output, later optional editor | Not until V0.6 |
| Mermaid / Structurizr | Export | No |
| Simulator | Reads `CompiledSystem` | No (snapshots only) |
| Importer | Packer onto the grid | Yes, once, then the 3D editor owns it |

**Named user through V0.5:** an engineer learning or practicing system design (interview, course, internal enablement). Staff-engineer design-review is a *side effect* of a diagram good enough to paste, not a second product.

---

## 3. Version map

Times assume **one builder**, full-time-equivalent intensity. They are order-of-magnitude, not a contract. Each version has a kill gate: if it fails, do not start the next version.

| Version | Insight to prove | ~Time | Status |
|---|---|---|---|
| **V0.1** | Factory → correct diagram | done | Shipped |
| **V0.2** | I would actually build here | 2–3 weeks | **Shipped** |
| **V0.3** | The graph is ready to run | ~1 week | **Shipped** |
| **V0.4** | I can see why this system breaks | 3–4 weeks | **Next** |
| **V0.5** | A stranger can learn from a scenario | 2 weeks | After V0.4 |
| **V0.6** | I can bring a 2D design into the factory | 2–3 weeks | After V0.5 |
| **V1.0** | A staff engineer ships this in a real design doc | only if 0.4–0.6 pulled | Not scheduled |

Simulation comes **before** bidirectionality. Simulation is the product nobody else has in this form. Import is compatibility. Breakscale already simulates on a 2D canvas; Constructs wins when the same true queueing is visible in the factory *and* still compiles to a diagram.

---

## 4. V0.2 — Make the factory usable

**Insight:** a user can build a 10–20 machine system without fighting the editor.

**Kill gate:** if after this version people still cannot keep a topology in their head, or still mis-click ports more than they connect them, do not add machines or simulation. Fix the editor.

### Work packages (in order)

1. **Undo / redo** — **done**  
   Snapshot stack over `World` (place, connect, rotate, delete, committed rename). Cap 100. Load sample / open JSON / clear reset the stack. Tests: undo place, undo connect, redo, load sample clears the stack.

2. **Selection and deletion that match intent** — **done**  
   Click a pipe to select/delete it. Shift-click multi-select (no 3D box-select). Delete works on pipes and machines. Escape still cancels pending port.

3. **Port hit targets** — **done**  
   Invisible pick spheres 2× visual radius. Pending port highlight. Compatible-port glow when a pending port is armed.

4. **Orthogonal pipes** — **done**  
   Manhattan route on the grid (X then Z, or Z then X; pick the path with fewer machine collisions). Visual only — the graph does not change.

5. **Camera** — **done**  
   Frame the occupied bounding box on Load sample / Open JSON. A “Frame build” button. No character controller.

6. **2D layout that does not thrash** — **done**  
   xyflow layout is elkjs layered + ports. Nodes stay non-draggable. `fitView` only when topology changes, not when you rotate a machine.

7. **World document hygiene** — **done**  
   Optional `name` / `description` on the JSON envelope (`WORLD_VERSION` still 1). Autosave to `localStorage` for crash recovery, still not an account.

### Files (expected)

- `src/store/history.ts` — snapshot stack
- `src/model/pipePath.ts` — orthogonal geometry
- `src/compiler/validate.ts` — compatible-port glow
- `src/compiler/diagram.ts` — elkjs
- `src/io/worldJson.ts` — envelope `name`
- `src/io/autosave.ts` — localStorage
- Tests next to each of those, no React in compiler/history tests if possible

### Out of V0.2

New machine kinds, sim sliders, 2D dragging, C4 people vs containers, elkjs as a science project beyond layered LR.

---

## 5. V0.3 — Sim-ready catalog (no engine yet)

**Insight:** every machine that will exist in V0.4 already has typed ports and numeric parameters, and `compile()` forwards those parameters on the graph.

**Kill gate:** if parameters are only labels in the inspector and do not appear on `CompiledSystem` nodes, you have not finished this version.

### Work packages

1. **Add two kinds that teach new physics** — **done**  
   - `rateLimiter` — `request` in/out; params `limitPerSec`  
   - `circuitBreaker` — `request` in/out; params `failureThreshold`, `resetMs`  

2. **Numeric slots on existing kinds** — **done**  
   Service / LB: `instances`, `capacity`, `serviceMs`. Queue: `maxDepth`, `ackImmediate`. Cache / DB: `serviceMs`, `hitRatio` (cache only). Pipes: `latencyMs`. Defaults live in the catalog. Missing fields in old JSON get defaults on parse (`WORLD_VERSION` still 1).

3. **`CompiledSystem` carries params** — **done**  
   Graph nodes/edges include the numbers. Exporters ignore them. Simulator will not parse the 3D scene.

4. **Sample uses limiter + breaker** — **done**  
   Load sample is client → LB → limiter → breaker → API, then cache / DB / queue / worker.

### Files

- `src/model/catalog.ts`, `src/model/types.ts`
- `src/compiler/compile.ts` — pass-through
- `src/ui/Inspector.tsx` — numbers
- `src/io/worldJson.ts` — defaults on load
- Tests for parse of v1 files that lack params

### Out of V0.3

CDN, shard, autoscaler, websocket gateway, serverless, 33-component parity with Breakscale. If a kind is “a service with different defaults,” do not add it.

---

## 6. V0.4 — Discrete-event execution

**Insight:** I can load the factory, push traffic, and watch *true* queueing produce latency, backlog, and breaker trips. The 2D diagram still matches the factory. The numbers are not animated approximations.

**Kill gate:** if any displayed percentile is not measured from completed requests, delete the vis and keep the engine. A plausible fake is worse than no sim. (Breakscale’s bar; steal it.)

### Architecture (do not violate)

```
src/sim/          pure TypeScript, no React, no Three
                  Engine(topology, seed) → advance(dtMs) → snapshot()

src/compiler/     World → CompiledSystem (already exists)
                  adapter: CompiledSystem → sim topology

src/scene/        samples snapshots at display Hz
                  tokens/particles are decorations of the snapshot
```

The engine runs in a Web Worker. The 3D thread never steps the event queue.

Deterministic seed. Request conservation tests. Utilization bounded. No `NaN`.

### Work packages (in order)

1. **Adapter** — `CompiledSystem` → sim topology. Untyped or missing params use catalog defaults. Invalid graphs refuse to run (errors already on `diagnostics`).

2. **Engine MVP** — client arrivals (Poisson), finite server slots (`instances × capacity`), queues with real depth, cache hit/miss, rate limiter, circuit breaker. Ported in spirit from Breakscale `src/sim`, not copy-pasted UI.

3. **Headless tests** — retry storm fixture, queue fill/drain, breaker open, conservation.

4. **Control strip** — load (req/s), play/pause, speed (1/10, 1/2, 1×, 4×), seed, reset. Not a game HUD.

5. **Readouts** — per-machine utilization, queue depth, p50/p95/p99 on the inspector and as a small 3D tag. Same numbers in a system strip.

6. **Slow motion in 3D** — tokens move along *already routed* pipes, spawned from snapshot events, capped (e.g. 200 tokens). Tokens are not the sim.

### Out of V0.4

Autoscaling, multi-region, packet-level networking, ns-3, “time travel debugger,” recording to video, 3D characters walking the factory.

---

## 7. V0.5 — Scenarios people can learn from

**Insight:** a new user can open one named scenario, press play, and explain the failure in a sentence.

**Kill gate:** if scenarios are just saved worlds with no copy, this is still V0.4. Teaching is the product surface.

### Work packages

1. **Four labs** (world JSON + short prose in `src/content/`):  
   - Happy path (the current sample, under light load)  
   - Retry storm  
   - Queue backlog / slow consumer  
   - Circuit breaker isolating a bad dependency  

2. **Glossary** — one paragraph per machine/channel, why it exists. Inspector links to it.

3. **Shareable hash** — compress `World` into the URL (`#w=`). No server. Size budget: if it does not fit, fall back to “download JSON.”

4. **Export still works while simulating** — diagram and DSL reflect structure, not live metrics (metrics are a view overlay). Do not bake p99 into Structurizr.

### Out of V0.5

Accounts, comments, leaderboards, course LMS, multiplayer “watch my sim.”

---

## 8. V0.6 — Bidirectional start

**Insight:** I can paste a Structurizr container view (or a Constructs-exported DSL) and get a factory on the floor I can then edit in 3D.

**Kill gate:** if round-trip `World → DSL → World` loses ports or invents edges, stop and fix the compiler before teaching 2D editing.

### Work packages

1. **Structurizr DSL import** of *our* export dialect first (properties `constructs.*`). That is a round-trip, not a general C4 parser.

2. **Grid packer** for imports that lack `constructs.x/z` — layered left-to-right by channel, one cell spacing, no overlaps.

3. **`syncSource` flag** (`'factory' | 'import' | 'diagram'`) so load does not loop.

4. **Optional 2D edit** — dragging a node still does not change topology; reconnecting a 2D edge writes a pipe. Easy to get wrong; ship import+packer first, 2D edit second if import is trusted.

5. **Mermaid import** is lossy — warn, require user confirm, map only flowchart LR nodes/edges we understand.

### Out of V0.6

Live AWS/Azure scan, IcePanel API sync, Terraform state, Kubernetes scrape. Those are Cloudcraft/Hava’s product. Our import is *design artifacts*, not production inventory.

---

## 9. V1.0 — Only if pulled

Do not schedule this. Re-open if V0.4–V0.6 are in real use.

Candidates, each still subject to delete:

- C4 people / system-context vs container views as *export modes*, not a second world model
- PlantUML / C4-PlantUML exporter
- Deployment view (still graph-backed)
- VS Code preview of `constructs.world` + DSL
- Git-friendly JSON pretty-print (already close) + a tiny CLI `constructs compile file.json`

Not candidates without a new insight: SaaS accounts, CRDT multiplayer, Datadog overlay, Omniverse, mobile layout.

---

## 10. Explicitly deleted (re-justify before adding)

| Temptation | Why it dies |
|---|---|
| Voxel terrain / mining / power | Wrong physics. Factories are machines + ports. |
| 33-component palette | Breakscale’s length; we add a kind only for new failure physics. |
| Godot / Bevy rewrite | Web tool with a DOM diagram. Keep R3F. Sim may later be a worker in Rust; the editor stays here. |
| 2D as second editor in V0.2 | Two sources of truth. Compiler output until V0.6. |
| Fake particles without an engine | Teaches lies. |
| AWS live import | Occupied market; wrong direction (observe ≠ design). |
| Auth, teams, comments | Automating a product that does not exist yet. |
| Character controller, first person, day/night | Game skin. VISSOFT: 3D chrome is what fails. |
| Generating Terraform / K8s YAML | A different compiler. Do not pretend the graph is infra-as-code. |

---

## 11. Technical invariants (all versions)

1. `compile()` stays pure and DOM-free.  
2. Invalid pipes never appear in Mermaid, Structurizr, or the 2D graph.  
3. Machine IDs are stable across save/load/sim snapshots.  
4. Grid pose and diagram pose are view state; topology is `machines` + `pipes`.  
5. `WORLD_VERSION` increments only when old files would be misread. Adding optional fields uses defaults, not a bump, until meaning changes.  
6. `src/sim/` (when it exists) imports nothing from `src/scene` or `src/ui`.  
7. Tests for model, compile, IO, and sim do not import React or Three.

---

## 12. Suggested build order for the next session

Start V0.4: a true discrete-event engine in `src/sim/` that reads `CompiledSystem` only. The catalog already carries limiter/breaker params; do not add more machine kinds until those numbers move requests.

Kill gate for the first sim slice: every displayed percentile is measured from completed requests. If you cannot prove that, delete the vis.

If time is constrained to a single short slice: **the engine + one request path through limiter and breaker** wins over a prettier inspector.
