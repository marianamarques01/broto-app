import { TopBar } from '@/components/layout/TopBar'

export function Profile() {
  return (
    <div>
      <TopBar title="Perfil" subtitle="Seus dados e progresso" />
      <div className="broto-main-inner">
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Em breve você verá e editará seu perfil aqui.</p>
      </div>
    </div>
  )
}
