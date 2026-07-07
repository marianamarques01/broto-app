import {
  Briefcase,
  Cpu,
  GraduationCap,
  Heart,
  Leaf,
  Palette,
  Scale,
  type LucideIcon,
} from 'lucide-react'
import { REDACAO_EIXO_COLORS, type RedacaoEixoTematico } from '@broto/shared'

export const REDACAO_EIXO_ICONS: Record<RedacaoEixoTematico, LucideIcon> = {
  educacao: GraduationCap,
  saude: Heart,
  meio_ambiente: Leaf,
  tecnologia: Cpu,
  trabalho: Briefcase,
  direitos_humanos: Scale,
  cultura: Palette,
}

export function getRedacaoEixoColor(eixo: RedacaoEixoTematico): string {
  return REDACAO_EIXO_COLORS[eixo]
}

export function getRedacaoEixoIcon(eixo: RedacaoEixoTematico): LucideIcon {
  return REDACAO_EIXO_ICONS[eixo]
}
