/** Fontes — iguais ao web (DM Sans + Fraunces) */
export const fonts = {
    sans: 'DMSans_400Regular',
    sansMedium: 'DMSans_500Medium',
    sansSemiBold: 'DMSans_600SemiBold',
    sansBold: 'DMSans_700Bold',
    display: 'Fraunces_900Black',
    displayBold: 'Fraunces_700Bold',
    displaySemiBold: 'Fraunces_600SemiBold',
} as const;

/** Escala de tamanhos de fonte — igual ao Tailwind/desktop (px) */
export const fontSize = {
    xs: 12,    // text-xs  0.75rem
    sm: 14,    // text-sm  0.875rem
    base: 16,  // text-base 1rem
    lg: 18,    // text-lg  1.125rem
    xl: 20,    // text-xl  1.25rem
    '2xl': 24, // text-2xl 1.5rem
    '3xl': 30, // text-3xl 1.875rem
    '4xl': 36, // text-4xl 2.25rem
    '5xl': 48, // text-5xl 3rem
    '6xl': 60, // text-6xl 3.75rem
} as const;

/** Espaçamento vertical típico para labels (mb-1.5 = 6px) */
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
    wordmarkMarginTop: 28,  // mt-7
    taglineMarginTop: 8,    // mt-2
    linkRowMarginTop: 24,   // mt-6
} as const;

export const colors = {
    bg: {
        void: '#070b07',
        deep: '#0b110b',
        surface: '#101810',
        card: '#152015',
        elevated: '#1a2a1a',
        overlay: 'rgba(7, 11, 7, 0.88)',
        glass: 'rgba(21, 32, 21, 0.6)',
    },
    green: {
        900: '#052e16',
        800: '#065f37',
        700: '#047857',
        600: '#059669',
        500: '#10b981',
        400: '#34d399',
        300: '#6ee7b7',
        200: '#a7f3d0',
        glow: 'rgba(16, 185, 129, 0.2)',
        glowStrong: 'rgba(16, 185, 129, 0.4)',
    },
    gold: {
        700: '#b45309',
        600: '#d97706',
        500: '#f59e0b',
        400: '#fbbf24',
        300: '#fcd34d',
        200: '#fde68a',
        glow: 'rgba(251, 191, 36, 0.2)',
        glowStrong: 'rgba(251, 191, 36, 0.4)',
    },
    blue: {
        600: '#1e40af',
        500: '#3b82f6',
        400: '#60a5fa',
        glow: 'rgba(59, 130, 246, 0.2)',
    },
    red: {
        500: '#ef4444',
        400: '#f87171',
        glow: 'rgba(239, 68, 68, 0.25)',
    },
    text: {
        primary: '#e8f0e8',
        secondary: '#9cb89c',
        muted: '#5a7a5a',
        /** placeholder: muted-foreground/40 (desktop) */
        muted40: 'rgba(90, 122, 90, 0.4)',
        inverse: '#070b07',
    },
    border: {
        subtle: 'rgba(16, 185, 129, 0.08)',
        default: 'rgba(16, 185, 129, 0.15)',
        strong: 'rgba(16, 185, 129, 0.3)',
    },
    semantic: {
        background: '#070b07',
        foreground: '#e8f0e8',
        card: '#152015',
        muted: '#101810',
        mutedForeground: '#5a7a5a',
        primary: '#10b981',
        primaryForeground: '#070b07',
        success: '#10b981',
        danger: '#ef4444',
        accent: '#fbbf24',
        accentSecondary: '#3b82f6',
    },
} as const;
