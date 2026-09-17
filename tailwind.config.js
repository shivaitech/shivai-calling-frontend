/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Tenant-branding surface tokens — CSS custom properties set by
        // src/contexts/ThemeContext.tsx (falls back to the stock ShivAI
        // light/dark look via :root/:root.dark defaults in src/index.css
        // when no tenant branding is active). See src/components/GlassCard.tsx.
        surface: 'var(--tenant-surface)',
        'surface-border': 'var(--tenant-surface-border)',
        'text-heading': 'var(--tenant-heading)',
        'text-body': 'var(--tenant-text)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
