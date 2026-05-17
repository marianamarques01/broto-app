import { TopBar } from '@/components/layout/TopBar'
import { BrotoChat } from '@/components/broto/BrotoChat'

export function BrotoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="Broto IA" subtitle="Assistente de estudos (em desenvolvimento)" />
      <BrotoChat />
    </div>
  )
}
