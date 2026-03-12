/**
 * Design system v2 — tokens e padrões visuais do app.
 * Cards de lista (ListCard) são o padrão para listas e missões.
 */

import { colors, fonts, fontSize } from '@/theme/tokens';

// ─── Espaçamento (grid 4px) ─────────────────────────────────────────────────
export const space = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

// ─── Border radius ─────────────────────────────────────────────────────────
export const radius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;

// ─── Tipografia ────────────────────────────────────────────────────────────
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
} as const;

// ─── Cores do design system (listas, seções, estados) ───────────────────────
export const dsColors = {
    /** Fundo padrão dos cards de lista (ex.: Missões de hoje) */
    listCard: '#1B2420',
    /** Barra vertical de destaque ao lado do título de seção (âmbar/laranja) */
    sectionAccent: colors.amber[500],
    /** Pill de progresso quando incompleto */
    pillIncomplete: colors.bg.elevated,
    pillIncompleteText: colors.text.muted,
    /** Pill de progresso quando completo */
    pillComplete: 'rgba(16, 185, 129, 0.18)',
    pillCompleteText: colors.green[400],
    /** Ícone do card ativo/desbloqueado (ex.: roxo Matemática) */
    iconActive: colors.violet[500],
    iconActiveBg: 'rgba(155, 109, 204, 0.25)',
    /** Ícone do card bloqueado (cadeado) */
    iconLocked: colors.green[500],
    iconLockedBg: 'rgba(16, 185, 129, 0.18)',
    /** Ícone do card concluído */
    iconDone: colors.green[500],
    iconDoneBg: 'rgba(16, 185, 129, 0.15)',
} as const;

// ─── Export agregado ───────────────────────────────────────────────────────
export const ds = {
    space,
    radius,
    typography,
    colors: dsColors,
} as const;
