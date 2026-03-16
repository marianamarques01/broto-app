/**
 * Tokens mínimos — redesign from zero.
 * Estrutura mantida para não quebrar imports; valores neutros para novo design.
 */

export const fonts = {
    sans: 'Raleway_400Regular',
    sansMedium: 'Raleway_500Medium',
    sansSemiBold: 'Raleway_600SemiBold',
    sansBold: 'Raleway_700Bold',
    display: 'Raleway_400Regular',
    displayBold: 'Raleway_700Bold',
    displaySemiBold: 'Raleway_600SemiBold',
    logo: 'Raleway_600SemiBold',
} as const;

export const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
} as const;

export const spacing = {
    labelGap: 6,
    inputGap: 16,
    sectionGap: 24,
    cardPadding: 24,
    cardPaddingTop: 32,
    cardPaddingBottom: 40,
    heroPaddingH: 24,
    heroPaddingTop: 80,
    heroPaddingBottom: 48,
    wordmarkMarginTop: 28,
    taglineMarginTop: 8,
    linkRowMarginTop: 24,
} as const;

export const space = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
} as const;

export const radii = {
    sm: 12,
    md: 16,
    lg: 24,
    full: 999,
} as const;

/** Paleta neutra — substituir no novo design */
export const colors = {
    bg: {
        void: '#0a0a0a',
        deep: '#111111',
        surface: '#171717',
        card: '#222222',
        elevated: '#2e2e2e',
        overlay: 'rgba(10, 10, 10, 0.93)',
        glass: 'rgba(23, 23, 23, 0.72)',
    },
    green: {
        900: '#14532d',
        800: '#166534',
        700: '#15803d',
        600: '#16a34a',
        500: '#22c55e',
        400: '#4ade80',
        300: '#86efac',
        200: '#bbf7d0',
        glow: 'rgba(34, 197, 94, 0.15)',
        glowStrong: 'rgba(34, 197, 94, 0.30)',
    },
    gold: {
        700: '#b45309',
        600: '#d97706',
        500: '#f59e0b',
        400: '#fbbf24',
        300: '#fcd34d',
        200: '#fde68a',
        glow: 'rgba(251, 191, 36, 0.12)',
        glowStrong: 'rgba(251, 191, 36, 0.28)',
    },
    blue: {
        600: '#2563eb',
        500: '#3b82f6',
        400: '#60a5fa',
        glow: 'rgba(59, 130, 246, 0.15)',
    },
    red: {
        500: '#ef4444',
        400: '#f87171',
        glow: 'rgba(239, 68, 68, 0.15)',
    },
    violet: {
        600: '#7c3aed',
        500: '#8b5cf6',
        400: '#a78bfa',
        glow: 'rgba(139, 92, 246, 0.15)',
    },
    amber: {
        600: '#d97706',
        500: '#f59e0b',
        400: '#fbbf24',
        glow: 'rgba(245, 158, 11, 0.15)',
    },
    text: {
        primary: '#fafafa',
        secondary: '#a3a3a3',
        muted: '#737373',
        muted40: 'rgba(115, 115, 115, 0.4)',
        inverse: '#0a0a0a',
    },
    border: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        default: 'rgba(255, 255, 255, 0.1)',
        strong: 'rgba(255, 255, 255, 0.18)',
    },
    semantic: {
        background: '#0a0a0a',
        foreground: '#fafafa',
        card: '#222222',
        muted: '#171717',
        mutedForeground: '#737373',
        primary: '#2AD468',
        primaryForeground: '#0a0a0a',
        success: '#2AD468',
        danger: '#ef4444',
        accent: '#fbbf24',
        accentSecondary: '#3b82f6',
    },
} as const;
