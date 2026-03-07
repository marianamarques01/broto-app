import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
        './theme/**/*.{ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DMSans_400Regular', 'system-ui', 'sans-serif'],
                'sans-medium': ['DMSans_500Medium', 'system-ui', 'sans-serif'],
                'sans-semibold': ['DMSans_600SemiBold', 'system-ui', 'sans-serif'],
                'sans-bold': ['DMSans_700Bold', 'system-ui', 'sans-serif'],
                display: ['Fraunces_900Black', 'Georgia', 'serif'],
                'display-bold': ['Fraunces_700Bold', 'Georgia', 'serif'],
                'display-semibold': ['Fraunces_600SemiBold', 'Georgia', 'serif'],
            },
            colors: {
                background: '#070b07',
                foreground: '#e8f0e8',
                card: '#152015',
                muted: {
                    DEFAULT: '#101810',
                    foreground: '#5a7a5a',
                },
                border: 'rgba(16, 185, 129, 0.15)',
                primary: {
                    DEFAULT: '#10b981',
                    foreground: '#070b07',
                },
                success: '#10b981',
                danger: '#ef4444',
                accent: '#fbbf24',
                'accent-secondary': '#3b82f6',
                broto: {
                    bg: {
                        void: '#070b07',
                        deep: '#0b110b',
                        surface: '#101810',
                        card: '#152015',
                        elevated: '#1a2a1a',
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
                    },
                    gold: {
                        700: '#b45309',
                        600: '#d97706',
                        500: '#f59e0b',
                        400: '#fbbf24',
                        300: '#fcd34d',
                        200: '#fde68a',
                    },
                    blue: {
                        600: '#1e40af',
                        500: '#3b82f6',
                        400: '#60a5fa',
                    },
                    red: {
                        500: '#ef4444',
                        400: '#f87171',
                    },
                    text: {
                        primary: '#e8f0e8',
                        secondary: '#9cb89c',
                        muted: '#5a7a5a',
                        inverse: '#070b07',
                    },
                },
            },
            borderRadius: {
                '4xl': '1.5rem',
                '5xl': '2rem',
            },
            // Escala igual ao desktop (Tailwind default em px para referência)
            fontSize: {
                xs: ['12px', { lineHeight: '1rem' }],
                sm: ['14px', { lineHeight: '1.25rem' }],
                base: ['16px', { lineHeight: '1.5rem' }],
                lg: ['18px', { lineHeight: '1.75rem' }],
                xl: ['20px', { lineHeight: '1.75rem' }],
                '2xl': ['24px', { lineHeight: '2rem' }],
                '3xl': ['30px', { lineHeight: '2.25rem' }],
                '4xl': ['36px', { lineHeight: '2.5rem' }],
                '5xl': ['48px', { lineHeight: '1' }],
                '6xl': ['60px', { lineHeight: '1' }],
            },
        },
    },
    plugins: [],
};

export default config;
