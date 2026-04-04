/**
 * Design system mínimo — redesign from zero.
 * Usa tokens; valores neutros para novo design.
 */

import { colors, fonts, fontSize } from '@/theme/tokens'

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const typography = {
  sectionTitle: {
    fontSize: fontSize.base,
    fontFamily: fonts.sansBold,
    color: colors.text.primary,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontFamily: fonts.sansSemiBold,
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    color: colors.text.muted,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fonts.sans,
    color: colors.text.muted,
  },
  pill: {
    fontSize: fontSize.xs,
    fontFamily: fonts.sansBold,
  },
} as const

export const dsColors = {
  listCard: '#222222',
  sectionAccent: colors.text.secondary,
  pillIncomplete: colors.bg.elevated,
  pillIncompleteText: colors.text.muted,
  pillComplete: 'rgba(34, 197, 94, 0.18)',
  pillCompleteText: colors.green[400],
  iconActive: colors.violet[500],
  iconActiveBg: 'rgba(139, 92, 246, 0.2)',
  iconLocked: colors.text.muted,
  iconLockedBg: 'rgba(115, 115, 115, 0.15)',
  iconDone: colors.green[500],
  iconDoneBg: 'rgba(34, 197, 94, 0.15)',
} as const

export const ds = {
  space,
  radius,
  typography,
  colors: dsColors,
} as const
