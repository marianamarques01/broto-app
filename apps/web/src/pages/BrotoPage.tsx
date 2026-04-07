import { TopBar } from '@/components/layout/TopBar'
import { BrotoChat } from '@/components/broto/BrotoChat'

export function BrotoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="Broto AI" subtitle="Seu assistente de estudos" />
      <BrotoChat />
    </div>
  )
}
