export type MachineKind =
  | 'client'
  | 'loadBalancer'
  | 'rateLimiter'
  | 'circuitBreaker'
  | 'service'
  | 'queue'
  | 'cache'
  | 'database'

export type ChannelKind = 'request' | 'async' | 'data'

export type Face = 'posX' | 'negX' | 'posZ' | 'negZ'

export type PortDirection = 'in' | 'out'

export type RotationY = 0 | 90 | 180 | 270

export type Vec3 = {
  x: number
  y: number
  z: number
}

export type PortSpec = {
  id: string
  label: string
  direction: PortDirection
  channel: ChannelKind
  face: Face
  slot: number
}

export type ParamValue = number | boolean

export type ParamSpec = {
  id: string
  label: string
  kind: 'number' | 'boolean'
  default: ParamValue
  min?: number
  max?: number
  step?: number
}

export type MachineSpec = {
  kind: MachineKind
  label: string
  short: string
  color: string
  description: string
  ports: readonly PortSpec[]
  params: readonly ParamSpec[]
}

export type PortRef = {
  machineId: string
  portId: string
}

export type Machine = {
  id: string
  kind: MachineKind
  name: string
  position: Vec3
  rotation: RotationY
  params?: Record<string, ParamValue>
}

export type Pipe = {
  id: string
  from: PortRef
  to: PortRef
  channel: ChannelKind
  latencyMs?: number
}

export type World = {
  machines: Record<string, Machine>
  pipes: Record<string, Pipe>
}

export type DiagnosticSeverity = 'error' | 'warning'

export type Diagnostic = {
  id: string
  code:
    | 'OVERLAP'
    | 'TYPE_MISMATCH'
    | 'DIRECTION_INVALID'
    | 'DANGLING_PORT_REF'
    | 'SELF_PIPE'
    | 'DISCONNECTED'
    | 'UNUSED_INPUT'
  severity: DiagnosticSeverity
  message: string
  machineIds: string[]
  pipeIds: string[]
}

export type GraphNode = {
  id: string
  kind: MachineKind
  label: string
  name: string
  params: Record<string, ParamValue>
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  sourcePort: string
  targetPort: string
  channel: ChannelKind
  label: string
  latencyMs: number
}

export type CompiledSystem = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  diagnostics: Diagnostic[]
  mermaid: string
  structurizr: string
  validPipeIds: string[]
}
