import { useCompiled } from '../store/worldStore.ts'

export function Diagnostics() {
  const compiled = useCompiled()
  const errors = compiled.diagnostics.filter((item) => item.severity === 'error')
  const warnings = compiled.diagnostics.filter((item) => item.severity === 'warning')

  return (
    <div className="diagnostics">
      <h2>Validation</h2>
      {compiled.diagnostics.length === 0 ? (
        <p className="ok">Graph is well-formed.</p>
      ) : null}
      {errors.map((item) => (
        <p key={item.id} className="error">
          {item.message}
        </p>
      ))}
      {warnings.map((item) => (
        <p key={item.id} className="warn">
          {item.message}
        </p>
      ))}
    </div>
  )
}
