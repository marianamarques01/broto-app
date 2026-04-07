import { BookOpen, Globe, FlaskConical, Calculator } from 'lucide-react'

export const AREA_CONFIG: Record<string, { color: string; icon: typeof BookOpen; label: string }> =
  {
    linguagens: { color: '#2dd4a8', icon: BookOpen, label: 'Linguagens' },
    'ciencias-humanas': { color: '#60a5fa', icon: Globe, label: 'Ciências Humanas' },
    'ciencias-natureza': { color: '#a78bfa', icon: FlaskConical, label: 'Ciências da Natureza' },
    matematica: { color: '#f5c842', icon: Calculator, label: 'Matemática' },
  }

export function getAreaColor(value: string): string {
  return AREA_CONFIG[value]?.color ?? '#888'
}

export function getAreaIcon(value: string) {
  return AREA_CONFIG[value]?.icon ?? BookOpen
}
