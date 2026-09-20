import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--theme-primary)',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;
