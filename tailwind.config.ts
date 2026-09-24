import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--theme-primary)',
          foreground: '#ffffff',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.40)',
          dark: 'rgba(255, 255, 255, 0.05)',
        },
      },
      boxShadow: {
        // Soft colored shadows for light theme & dark counterparts
        'soft-xs': 'var(--shadow-soft-xs)',
        'soft-sm': 'var(--shadow-soft-sm)',
        'soft': 'var(--shadow-soft)',
        'soft-md': 'var(--shadow-soft-md)',
        'soft-lg': 'var(--shadow-soft-lg)',
        'soft-xl': 'var(--shadow-soft-xl)',
        'soft-2xl': 'var(--shadow-soft-2xl)',
        // Glassmorphism 2.0 shadows & 1px inset borders
        'glass': 'var(--glass-shadow)',
        'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'glass-inset-light': 'inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
        // Override default shadow scale with soft colored shadows for light theme
        'xs': 'var(--shadow-soft-xs)',
        'sm': 'var(--shadow-soft-sm)',
        'DEFAULT': 'var(--shadow-soft)',
        'md': 'var(--shadow-soft-md)',
        'lg': 'var(--shadow-soft-lg)',
        'xl': 'var(--shadow-soft-xl)',
        '2xl': 'var(--shadow-soft-2xl)',
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-primary': 'var(--glow-primary)',
        'glow-accent': 'var(--glow-accent)',
        'glow-subtle': 'var(--glow-subtle)',
        'glow-ambient': 'var(--glow-ambient)',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.017em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.021em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.022em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.024em' }],
        '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.026em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.028em' }],
        '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;

