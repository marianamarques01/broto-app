import type { Config } from 'tailwindcss';

/** Config mínima — redesign from zero. Sem tema customizado. */
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
        extend: {},
    },
    plugins: [],
};

export default config;
