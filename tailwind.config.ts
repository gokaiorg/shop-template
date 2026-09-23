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
    },
  },
  plugins: [
    typography,
  ],
};

export default config;

