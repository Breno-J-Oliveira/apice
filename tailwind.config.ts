import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="musgo"]', '[data-theme="ardosia"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-card': 'var(--color-bg-card)',
        'bg-hover': 'var(--color-bg-hover)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-soft': 'var(--color-accent-soft)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgb(0,0,0,0.04)',
        'soft-md': '0 12px 40px rgb(0,0,0,0.06)',
        'soft-lg': '0 20px 60px rgb(0,0,0,0.08)',
        'card': '0 1px 3px rgb(0,0,0,0.04), 0 1px 2px rgb(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgb(0,0,0,0.06), 0 2px 4px rgb(0,0,0,0.04)',
        'glow': '0 0 0 4px var(--color-glow)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
