import { BookOpen, Globe, FlaskConical, Calculator } from 'lucide-react'

export const AREA_CONFIG: Record<string, { color: string; icon: typeof BookOpen; label: string }> =
  {
    linguagens: { color: '#2ba4b8', icon: BookOpen, label: 'Linguagens' },
    'ciencias-humanas': { color: '#e5960e', icon: Globe, label: 'Ciências Humanas' },
    'ciencias-natureza': { color: '#10b981', icon: FlaskConical, label: 'Ciências da Natureza' },
    matematica: { color: '#9b6dcc', icon: Calculator, label: 'Matemática' },
  }

export function getAreaColor(value: string): string {
  return AREA_CONFIG[value]?.color ?? '#888'
}

export function getAreaIcon(value: string) {
  return AREA_CONFIG[value]?.icon ?? BookOpen
}
