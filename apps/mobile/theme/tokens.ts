/** Fontes — iguais ao web (DM Sans + Fraunces); logo em Outfit (sans-serif) */
export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  display: 'Fraunces_900Black',
  displayBold: 'Fraunces_700Bold',
  displaySemiBold: 'Fraunces_600SemiBold',
  /** Fonte da logo "broto" e rotulos de fase (Semente, Muda, etc.) — sans-serif */
  logo: 'Outfit_600SemiBold',
} as const

/** Escala de tamanhos de fonte — igual ao Tailwind/desktop (px) */
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
} as const

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
} as const

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
} as const

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  full: 16,
} as const

/** Paleta v4 — preto profundo + verde como aura */
export const colors = {
  bg: {
    void: '#070c09',
    deep: '#0b130f',
    surface: '#0e1914',
    card: '#111e18',
    elevated: '#162a20',
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
    600: '#1a6d8a',
    500: '#2ba4b8',
    400: '#4ec4d4',
    glow: 'rgba(43, 164, 184, 0.15)',
  },
  red: {
    500: '#e05252',
    400: '#f08080',
    glow: 'rgba(224, 82, 82, 0.15)',
  },
  violet: {
    600: '#7c4daa',
    500: '#9b6dcc',
    400: '#b794e0',
    glow: 'rgba(155, 109, 204, 0.15)',
  },
  amber: {
    600: '#c47a10',
    500: '#e5960e',
    400: '#f5b642',
    glow: 'rgba(229, 150, 14, 0.15)',
  },
  text: {
    primary: '#e5ece5',
    secondary: '#a0b8a0',
    muted: '#6b876b',
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
  /** Botão principal (pílula verde) — mesmo visual do login/cadastro */
  cta: {
    gradientStart: '#38703D',
    gradientEnd: '#62BD69',
    gradient: ['#38703D', '#62BD69'] as const,
    /** Capsula: cantos semicirculares em qualquer altura (equivalente a border-radius muito alto na web) */
    radius: radii.full,
    text: '#ffffff',
  },
} as const

/** Distância do fundo da tela ao FAB do Broto (acima do dock — ajustar com MobileTabBar). */
/** Ajuste com o dock (botão Início + recorte) — alinha o chat Broto acima da barra */
export const MOBILE_TAB_FAB_OFFSET = 112
