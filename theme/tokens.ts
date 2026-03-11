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
        void: '#070c09',       // preto profundo, verde só como aura (um pouco mais claro)
        deep: '#0b130f',       // escuro denso
        surface: '#0e1914',    // floresta noturna
        card: '#111e18',       // cards — escuro com alma verde
        elevated: '#162a20',   // elevado — perceptível
        overlay: 'rgba(7, 12, 9, 0.93)',
        glass: 'rgba(11, 19, 15, 0.72)',
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
        glow: 'rgba(16, 185, 129, 0.15)',
        glowStrong: 'rgba(16, 185, 129, 0.30)',
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
        600: '#1a6d8a',        // teal profundo
        500: '#2ba4b8',        // teal principal
        400: '#4ec4d4',        // teal claro
        glow: 'rgba(43, 164, 184, 0.15)',
    },
    red: {
        500: '#e05252',        // coral quente
        400: '#f08080',        // coral claro
        glow: 'rgba(224, 82, 82, 0.15)',
    },
    violet: {
        600: '#7c4daa',        // roxo quente
        500: '#9b6dcc',        // roxo principal
        400: '#b794e0',        // roxo claro
        glow: 'rgba(155, 109, 204, 0.15)',
    },
    amber: {
        600: '#c47a10',
        500: '#e5960e',        // âmbar orgânico
        400: '#f5b642',
        glow: 'rgba(229, 150, 14, 0.15)',
    },
    text: {
        primary: '#e5ece5',    // branco suave com toque verde
        secondary: '#a0b8a0',  // verde-cinza médio
        muted: '#6b876b',      // legível em bg.card
        muted40: 'rgba(107, 135, 107, 0.4)',
        inverse: '#040705',
    },
    border: {
        subtle: 'rgba(16, 185, 129, 0.06)',
        default: 'rgba(16, 185, 129, 0.12)',
        strong: 'rgba(16, 185, 129, 0.22)',
    },
    semantic: {
        background: '#070c09',
        foreground: '#e5ece5',
        card: '#111e18',
        muted: '#0e1914',
        mutedForeground: '#6b876b',
        primary: '#10b981',
        primaryForeground: '#040705',
        success: '#10b981',
        danger: '#e05252',
        accent: '#fbbf24',
        accentSecondary: '#2ba4b8',
    },
} as const;
