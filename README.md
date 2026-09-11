# Constructs

Factory-style 3D system design that compiles into a 2D architecture diagram.

V0.1 proves one loop: **place machines → connect typed ports → see a live 2D diagram and Mermaid**. V0.2 is the usable editor. V0.3 is a sim-ready catalog: rate limiter and circuit breaker with numeric params on the compiled graph.

## Run

```bash
npm install
npm test
npm run dev
```

Then open the Vite URL, click **Load sample**, and watch the right-hand diagram update as you stamp, rotate, and wire machines. Select a machine to edit its numeric params (capacity, limit/sec, breaker threshold). **Undo** / **Redo** reverse factory edits. **Frame build** fits the camera. **Save JSON** / **Open JSON** round-trip the factory; a world name sits on the envelope, and the last world autosaves in the browser for crash recovery. The export panel copies Mermaid or a Structurizr container-view DSL.

## Docs

- [Research](docs/research.md)
- [V0.1 PRD](docs/prd-v0.1.md)
- [Technical design](docs/technical-design-v0.1.md)
- [Implementation roadmap](docs/roadmap.md)

## Controls

- Click a palette machine, then a floor cell, to stamp
- Click an output port, then a compatible input port, to pipe
- Click a pipe to select it · Shift-click to add to the selection
- `R` rotate · `Delete` remove · `Esc` cancel a pending port
- `Ctrl+Z` undo · `Ctrl+Y` or `Ctrl+Shift+Z` redo
- **Frame build** fits the camera to placed machines
