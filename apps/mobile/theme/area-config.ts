/**
 * Shared area configuration — single source of truth for icons, colors, labels.
 * Used by: Home, Questions, Study, Progress, Routine screens.
 */
import { BookOpen, Globe2, FlaskConical, Calculator, FileText, Globe } from 'lucide-react-native'
import { colors } from './tokens'

export interface AreaConfig {
  label: string
  short: string
  color: string
  glow: string
  textColor: string
  gradientFrom: string
  gradientTo: string
  Icon: React.ComponentType<{ size?: number; color?: string }>
  /** Alternate icon (for screens that use FileText/Globe instead of BookOpen/Globe2) */
  AltIcon: React.ComponentType<{ size?: number; color?: string }>
}

export const AREA_CONFIG: Record<string, AreaConfig> = {
  linguagens: {
    label: 'Linguagens',
    short: 'LCT',
    color: colors.blue[500],
    glow: colors.blue.glow,
    textColor: colors.blue[400],
    gradientFrom: 'rgba(43,164,184,0.18)',
    gradientTo: 'rgba(43,164,184,0.04)',
    Icon: BookOpen,
    AltIcon: FileText,
  },
  'ciencias-humanas': {
    label: 'Ciencias Humanas',
    short: 'HUM',
    color: colors.amber[500],
    glow: colors.amber.glow,
    textColor: colors.amber[400],
    gradientFrom: 'rgba(229,150,14,0.18)',
    gradientTo: 'rgba(229,150,14,0.04)',
    Icon: Globe2,
    AltIcon: Globe,
  },
  'ciencias-natureza': {
    label: 'Ciencias da Natureza',
    short: 'NAT',
    color: colors.green[500],
    glow: colors.green.glow,
    textColor: colors.green[400],
    gradientFrom: 'rgba(16,185,129,0.18)',
    gradientTo: 'rgba(16,185,129,0.04)',
    Icon: FlaskConical,
    AltIcon: FlaskConical,
  },
  matematica: {
    label: 'Matematica',
    short: 'MAT',
    color: colors.violet[500],
    glow: colors.violet.glow,
    textColor: colors.violet[400],
    gradientFrom: 'rgba(155,109,204,0.18)',
    gradientTo: 'rgba(155,109,204,0.04)',
    Icon: Calculator,
    AltIcon: Calculator,
  },
}

export const DEFAULT_AREA_CONFIG: AreaConfig = {
  label: 'Questões',
  short: '?',
  color: colors.text.muted,
  glow: colors.green.glow,
  textColor: colors.text.primary,
  gradientFrom: colors.bg.card,
  gradientTo: colors.bg.surface,
  Icon: BookOpen,
  AltIcon: BookOpen,
}

export function getAreaConfig(key: string): AreaConfig {
  return AREA_CONFIG[key] ?? DEFAULT_AREA_CONFIG
}
