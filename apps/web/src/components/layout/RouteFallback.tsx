export function RouteFallback() {
  return (
    <div
      className="broto-auth"
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
      style={{ width: '100%', justifyContent: 'center' }}
    >
      <div
        className="broto-auth__card"
        style={{ maxWidth: 320, padding: '2rem', textAlign: 'center' }}
      >
        <p className="broto-auth__title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          broto
        </p>
        <p className="broto-auth__subtitle" style={{ margin: 0 }}>
          Carregando…
        </p>
      </div>
    </div>
  )
}
