# Constructs — Phase 1 Research

**Product idea:** a factory-style 3D construction environment for system design, with a live compiler that emits a correct 2D architecture diagram (and architecture-as-code) from the 3D build.

**Research date:** 2026-09-10

This document records prior art, technical building blocks, gaps, and feasibility risks. Relevance ratings are relative to Constructs, not to the industry in general.

---

## 1. Prior art

### 1.1 3D software / cloud architecture diagramming

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| [Cloudcraft](https://www.cloudcraft.co/) (Datadog) | Professional isometric 3D/2D diagrams of AWS/Azure, plus live account scanning | **High** | Closest commercial visual language. 3D is a *presentation projection* of cloud resources, not a construction game. No typed pipes, no factory loop, no compile-from-build. Proves 3D isometric architecture is commercially valuable. |
| [iCraft Editor](https://icraft.design/) ([gantFDT/icraft](https://github.com/gantFDT/icraft), ~1.5k stars) | Web 3D scene editor for architecture / flow / digital-twin overlays | **High** | Closest “draw a 3D architecture diagram” tool. SDK can drive element state from live data. Still a *diagrammer*, not a builder: no grid construction, no typed ports, no compiler into C4/Mermaid. |
| [Lucidscale](https://lucid.co/lucidscale/create/system-architecture-diagram-tool) | Data-backed auto diagrams from AWS/Azure/GCP | **Medium** | Professional 2D documentation from live infra. Opposite construction direction (import reality → diagram). |
| [Hava.io](https://www.hava.io/hava-automated-cloud-diagramming) | Automated cloud/K8s topology diagrams | **Medium** | Same class as Lucidscale: reverse-engineering, not design-time construction. |
| [IcePanel](https://icepanel.io/) | Collaborative C4 modelling with flows | **High** | Best-in-class *model-driven* 2D architecture tool. Proves teams want a model, not a drawing. No 3D, no simulation. Target export peer. |
| [Structurizr](https://docs.structurizr.com/dsl) | C4 architecture-as-code (DSL + JSON workspace) | **High** | Canonical professional export target. JSON schema exists; CLI exports Mermaid/PlantUML. Constructs should compile *to* this family, not invent a rival modelling language. |

### 1.2 Software-as-a-city / Minecraft visualizers

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| [CodeCity](https://wettel.github.io/codecity.html) (Wettel/Lanza, VISSOFT/ICPC 2007–2008) | Classes as buildings, packages as districts; metrics → height/width/color | **Medium** | Foundational 3D software visualization. **Read-only reverse engineering of source**, not system *design*. City metaphor ≠ factory metaphor. |
| [CodeMetropolis](https://codemetropolis.github.io/CodeMetropolis/) | CodeCity pipeline that emits a Minecraft world | **Medium** | Direct Minecraft prior art. Still metric-driven visualization of existing code, not construction of distributed systems. |
| [JSCity](https://github.com/aserg-ufmg/JSCity) (~1.4k stars) | JS source as navigable 3D cities | **Low** | Same city-metaphor family in the browser. |
| [ExplorViz](https://explorviz.dev/) | WebGL/WebXR software-landscape visualization from static analysis + OpenTelemetry | **Medium** | Live traces in a 3D city. Observability visualization, not a design construction tool. |
| [Getaviz](https://github.com/softvis-research/Getaviz) | 2D/3D/VR exploration of software artifacts | **Low** | Research platform; not a design compiler. |
| [Code Park](https://www.maghoumi.com/wp-content/uploads/2017/08/CodePark-VISSOFT17.pdf) (VISSOFT 2017) | 3D rooms of source to exploit spatial memory | **Low** | Confirms spatial memory helps comprehension; not architecture modelling. |
| SeeIT 3D (VISSOFT 2013 empirical study) | 3D plugin vs Eclipse; +13% / 45% faster on overview tasks, slower on bugfix tasks | **High** | Hard evidence: 3D helps *overview/structure* tasks and hurts *detail/edit* tasks. Constructs must keep a first-class 2D diagram, not replace it. |

### 1.3 Distributed-systems simulators and visualizers

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| [Breakscale](https://breakscale.tech/) ([xevrion/breakscale](https://github.com/xevrion/breakscale), ~1.1k stars) | Browser 2D canvas + *real* discrete-event simulation of queues, LBs, CBs, retry storms | **High** | Closest *semantic* cousin. 33 components, UI-free `src/sim` engine, deterministic seed, measured percentiles. **No 3D. No architecture export.** The engine-isolation pattern is the correct later simulation architecture. |
| [µqSim](https://www.csl.cornell.edu/~delimitrou/papers/2019.ispass.qsim.pdf) (Cornell, ISPASS 2019) | Validated queueing-network simulator for microservice graphs | **High** | Formal target for post-V0.1 execution. Topology = graph of queue-consumer stages. Constructs' compiled graph should be able to feed a µqSim-class engine. |
| QPME / SimQPN | Queueing Petri net modelling of microservice topologies | **Medium** | Academic performance modelling. Too heavy for V0.1; useful as a future export/analysis path. |
| [Kiali](https://v1-43.kiali.io/docs/features/topology/) | Istio service-mesh topology from live telemetry | **Medium** | Professional 2D “what is running.” Animated traffic, circuit-breaker badges. Reverse of Constructs (observe → diagram, not build → diagram). |
| CloudSim / OMNeT++ / ns-3 | Classic network/cloud DES | **Low** | Proven engines, terrible product UX. Do not wrap these for V0.1. |

### 1.4 Digital twins / infrastructure 3D

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| [NVIDIA Omniverse data-center twin](https://blogs.nvidia.com/blog/omniverse-digital-twin-data-center/) + Patch Manager | Physical racks, cables, cooling; NVIDIA Air for network simulation | **Low** | Physical-layer twin, not logical system design. Wrong altitude. |
| iCraft “digital twin” SDK | Overlay live status onto 3D architecture scenes | **Medium** | Shows demand for *runtime state on a 3D diagram*. Constructs should keep element IDs stable so this is possible later. |
| Cloudcraft live scan | Reverse-engineer AWS into isometric 3D | **Medium** | Bidirectionality competitor for a later “import real topology” milestone. |

### 1.5 Games, mods, educational construction

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| Create (Minecraft) | Kinetic + item + fluid networks; machines with sided ports; pipes/belts as first-class logistics | **High** | Primary *feel* reference. Sided inventories and typed conduits (items/fluids/stress) are the right port model. |
| Immersive Engineering | Multiblock machines, wires, redstone control | **Medium** | Multiblocks and power networks as a later “composed machine” idea. Skip for V0.1. |
| [CC: Tweaked](https://www.tweaked.cc/) / ComputerCraft | Lua computers, rednet, peripherals on machines | **Medium** | Programming *inside* the world. Educational, not architecture. Do not put a Lua VM in V0.1. |
| Minecraft Education / Redstone | Logic gates, ALUs as teaching tools | **Low** | Teaches boolean logic, not distributed systems. |
| Factorio / Satisfactory | Factory games as unofficial distributed-systems simulators (belts = Kafka, splitters = LBs, buffers = queues) | **High** | Cultural proof the metaphor *already works in engineers' heads*. Multiple widely-read essays. Nobody has productized the metaphor into a professional diagram compiler. |
| [shapez.io](https://github.com/tobspr-games/shapez.io) | Open-source browser factory builder, grid + typed belts | **High** | Web-native construction UX. Custom canvas engine, not Three.js. Take the *interaction* (stamp, rotate, connect), not the engine. |
| Redstone / OpenComputers / Integrated Dynamics | In-game logic/item systems | **Low** | Fun, not a path to C4 diagrams. |

### 1.6 Bidirectional / hybrid diagram research

| Artifact | What it is | Relevance | Notes |
|---|---|---|---|
| He et al., *A bidirectional-transformation-based framework for software visualization and visual editing* (Sci. China Inf. Sci. 2014) | BX (bidirectional transformation) between model and visual syntax | **High** | Academic backing for “one abstract syntax, many views.” Constructs' canonical graph is this abstract syntax. |
| [HyLiMo](https://arxiv.org/pdf/2403.13711) (2024) | Live-sync textual DSL ↔ graphical editor; layout stored in the DSL | **High** | Correct pattern for later bidirectionality: edits in either view write through a shared model. Layout is *view state*, not model state — except when the user explicitly pins it. |
| *A General Architecture for Client-Agnostic Hybrid Model Editors as a Service* (2022) | LSP + GLSP, shared abstract syntax, multiple graphical views | **Medium** | Overkill for V0.1, right long-term if Constructs becomes an IDE extension. |
| [Spacerizr](https://github.com/tobiascervin/spacerizr) | Three.js 3D/2D viewer for Structurizr DSL | **High** | 3D is a *viewer* of C4, not an editor. Constructs is the inverse: editor that *emits* C4. Complementary, possibly an export consumer. |
| DrakoFlow / aac YAML↔React Flow | Drag-to-code sync with a `syncSource` flag | **Medium** | Practical loop-prevention for bidirectional editors. Steal this flag later. |

### 1.7 3D visualization usability (do not ignore)

Teyseyre & Campo, *An Overview of 3D Software Visualization* (IEEE TVCG 2008) and later VISSOFT work converge on the same constraints:

1. 3D helps **overview, structure, and memory**.
2. 3D hurts **dense text, precise editing, and occlusion**.
3. Usability failures are usually **selection and 2D chrome overlaid on 3D**, not the spatial metaphor itself (VISSOFT 2020 AR study).
4. A 2D companion view is not a cop-out; it is how 3D tools stay useful.

Constructs' split view (3D factory + compiled 2D diagram) is therefore not a compromise. It is the design that the literature already recommends.

---

## 2. Technical building blocks

### 2.1 3D engines (web-first)

| Option | Verdict | Why |
|---|---|---|
| **React Three Fiber + Three.js + Drei** | **Choose for V0.1** | Web-first, React-native, ~900k weekly R3F downloads, orbit/grid/lines batteries via Drei. Scene graph maps cleanly onto a React app that also hosts a 2D diagram. |
| Three.js imperative | Viable, more glue | Use only if we leave React. We will not. |
| Babylon.js | Reject for V0.1 | Stronger built-in editor/XR/physics; larger bundle; weaker React story. Revisit if we need a visual scene editor or WebXR. |
| Godot 4 web export | Reject for V0.1 | Excellent factory-game feel, but 10–35MB WASM, painful DOM/2D-diagram integration, COOP/COEP thread headers. Keep as a possible later “playable sim” client, not the tool shell. |
| Bevy WASM | Reject for V0.1 | Best tick-rate/sim performance later; worst tool-app integration now. A future DES worker could be Bevy/Rust; the editor should not be. |
| PlayCanvas | Reject | Cloud editor lock-in relative to our open-source stance. |

**Voxel libraries:** `r3f-voxels`, voxel.js, Minecraft-style chunk meshing. **Do not use for V0.1.** Factory construction is *grid-placed machines with ports*, not destructible voxel terrain. Voxel engines optimize the wrong problem (greedy meshing of millions of cubes) and buy none of the semantic model.

### 2.2 Graph modelling and 2D layout

| Option | Verdict |
|---|---|
| **@xyflow/react (React Flow)** | **Choose** for the live 2D diagram. Industry standard, node/edge typed data, easy custom nodes. |
| **@dagrejs/dagre** | **Choose** for V0.1 auto-layout. Sync, small, good enough for DAGs of <50 nodes. |
| elkjs | Next layout engine when we need ports, hierarchy, or orthogonal edge routing (C4 containers). |
| cytoscape.js | Broader algorithms; heavier. Not needed. |
| Mermaid | **Export format**, not the live editor. Live Mermaid re-layout is jumpy; xyflow is the interactive view. |
| PlantUML / C4-PlantUML | Secondary export later. |
| Structurizr DSL/JSON | **Strategic export**. V0.1 can emit a *simplified* DSL subset; full workspace JSON is V0.2. |

### 2.3 Discrete-event simulation (post V0.1, design now)

| Option | Notes |
|---|---|
| Breakscale `src/sim` pattern | Isolate a pure engine with no DOM. Topology + seed → snapshots. **Copy this architecture**, do not fork the UI. |
| [discrete-sim](https://github.com/anesask/discrete-sim) | SimPy-like TypeScript generators, zero deps. Candidate engine. |
| simloop | Event-map DES, TypeScript, resources/queues built in. |
| SimScript | async/await DES with 2D/3D animation hooks (A-Frame/X3DOM — dated hosts). |
| µqSim | Research-grade microservice queueing; likely too heavy to embed, right *model*. |

V0.1 ships **no simulator**. The compiled graph must still be a valid DES topology: nodes with capacity/service-time slots (unused), typed edges with channel kinds.

### 2.4 Architecture-as-code formats

Priority order for Constructs exporters:

1. **Internal canonical JSON** (our graph) — source of truth.
2. **Mermaid flowchart** — universal, GitHub-native, V0.1.
3. **Structurizr DSL** (container view) — V0.2.
4. PlantUML / C4-PlantUML — V0.2.
5. JSON Canvas / xyflow dump — debugging.

Do not make Mermaid the source of truth. It cannot round-trip ports, grid positions, or validation.

---

## 3. Gaps and opportunities

### What has never been combined

There are tools that:

- **Draw** 3D architecture (Cloudcraft, iCraft)
- **Import** live infra into diagrams (Cloudcraft, Lucidscale, Hava)
- **Model** architecture as C4 (IcePanel, Structurizr)
- **Simulate** distributed systems on a 2D canvas (Breakscale)
- **Visualize** existing code as 3D cities (CodeCity, CodeMetropolis, ExplorViz)
- **Feel** like factory games (Create, Factorio, shapez)

Nobody ships: **construct a typed system in a factory 3D world → instantly obtain a professional 2D diagram and architecture-as-code**, with a graph formal enough to simulate later.

That combination is the product.

### Where existing tools fall short

| Need | Who almost does it | What they miss |
|---|---|---|
| Playful construction | Factorio / Create / shapez | Output is a save file, not a system diagram |
| Professional 2D diagram | IcePanel / Structurizr / Lucid | Construction is drag-boxes, not spatial/tactile |
| Pretty 3D architecture | Cloudcraft / iCraft | 3D is a skin; no typed ports, no compile step, no factory grammar |
| True queueing behaviour | Breakscale / µqSim | 2D only; no export to C4; not a documentation tool |
| Minecraft familiarity | CodeMetropolis | Read-only metrics city; cannot *design* a service graph |
| Bidirectional model↔view | HyLiMo / IcePanel | 2D only |

### Educational vs professional market

**Education (faster wedge):** system-design interview prep, university distributed-systems courses, internal enablement. Breakscale and factory-game essays prove demand. Constructs wins if the 3D build produces a diagram students can paste into a design doc.

**Professional (larger, slower):** design reviews, C4 authoring that non-architects will actually do, “explain this service to a new hire.” IcePanel/Structurizr already own serious modelling. Constructs wins only if (a) the compiled diagram is *good enough to ship*, and (b) 3D is faster than boxes for people who think in pipelines.

**Do not** compete with Datadog/Cloudcraft on live AWS scanning in V0.x. That is a later import adapter onto the same graph.

Market signal: Cloudcraft was valuable enough for Datadog to buy and productize; IcePanel is a growing C4 SaaS; Breakscale reached 1k+ GitHub stars as a teaching sim. The category is real. The *factory → diagram* loop is unoccupied.

---

## 4. Feasibility risks

### 4.1 Usability of 3D construction for complex systems — **High risk**

Literature says 3D fails at detail work and occlusion. Mitigation baked into V0.1:

- Floor grid only (no flying voxel caves).
- Hard cap mindset: V0.1 graphs of ~6–20 machines, not 200.
- Compiled 2D diagram is always visible.
- Selection happens on ports and a 2D list, not only by clicking occluded meshes.
- Later: floors / layers as C4 containers, not a free 3D jumble.

### 4.2 Semantic formalization of machines and pipes — **High risk**

If a “pipe” is just a colored line, the compiler cannot validate or simulate. V0.1 requires:

- Machines as typed nodes with **ports** (direction + channel).
- Pipes as edges between ports, not between machine centroids.
- Channel kinds: `request` (sync), `async` (queue), `data` (store).
- Validation as a pure function over the graph.

This is the entire product. Visuals without this are iCraft.

### 4.3 Performance of live compilation and later simulation — **Low for V0.1, High later**

Compiling tens of nodes to Mermaid/xyflow is cheap. Later DES of thousands of in-flight requests at 1/10 realtime, rendered as particles in 3D, is not. Mitigation: keep `compiler/` and a future `sim/` free of React; run sim on a worker; 3D only samples snapshots.

### 4.4 Path to bidirectionality — **Medium risk**

3D spatial layout and 2D auto-layout are different embeddings of the same graph. Round-tripping without a shared model produces layout fights.

Mitigation: **the typed graph is canonical**. 3D stores `gridPosition` + `rotation` as *physical view state*. 2D stores `layoutPosition` as *diagram view state*. Importing a 2D design later is “create machines + run a packer to place them on the grid,” not “the 2D pixels are the world.”

HyLiMo/BX research says this works if view-specific layout is not stuffed into the abstract syntax except as optional annotations.

### 4.5 Other risks

- **Metaphor leakage:** factory games have resources, power, and recipes. Software systems have requests, consistency, and failure. If we copy Create too literally we teach the wrong physics. Typed channels + later DES with failures are the correction.
- **Empty-palette syndrome:** too many machine kinds stall V0.1. Six kinds prove the loop.
- **Web 3D on low-end laptops:** keep lights, geometry, and draw calls tiny. Instancing later, not now.

---

## 5. Decision that survives first-principles review

**Delete voxel terrain. Delete simulation from V0.1. Delete C4 nesting. Delete 2D→3D import.**

Keep one loop: **place machines on a grid, connect typed ports, see a correct 2D diagram and Mermaid update.**

The graph is the product. The 3D scene is an editor for the graph. The 2D diagram is a compiler output. Simulation and bidirectionality plug into the graph later without rewriting the editor.
