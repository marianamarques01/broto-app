import { TopBar } from '@/components/layout/TopBar'

export function Settings() {
  return (
    <div>
      <TopBar title="Configurações" subtitle="Preferências e ajustes da conta" />
      <div className="broto-main-inner">
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Em breve você poderá ajustar suas preferências aqui.</p>
      </div>
    </div>
  )
}
