import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant', 'Georgia', 'serif'],
        sans:  ['Montserrat', 'system-ui', 'sans-serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        charcoal:      '#223843',
        platinum:      '#eff1f3',
        'dust-grey':   '#dbd3d8',
        'desert-sand': '#d8b4a0',
        'burnt-peach': '#d77a61',
        // Keep brand scale for any legacy usage
        brand: {
          50:  '#fdf5f3',
          100: '#f9e8e2',
          200: '#f2cfc3',
          300: '#e8ad9b',
          400: '#d77a61',
          500: '#c96248',
          600: '#b04d36',
          700: '#8d3c29',
          800: '#6b2e1f',
          900: '#502318',
        },
      },
      boxShadow: {
        'soft':       '0 2px 16px rgba(34,56,67,0.06)',
        'card':       '0 4px 32px rgba(34,56,67,0.08)',
        'card-hover': '0 10px 48px rgba(34,56,67,0.13)',
        'warm':       '0 4px 20px rgba(215,122,97,0.22)',
        'warm-lg':    '0 8px 36px rgba(215,122,97,0.32)',
        'pastel':     '0 8px 40px rgba(216,180,160,0.18)',
        'inner-warm': 'inset 0 2px 8px rgba(216,180,160,0.15)',
      },
      backgroundImage: {
        'hero-warm':  'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(216,180,160,0.22) 0%, transparent 70%)',
        'cta-warm':   'linear-gradient(135deg, rgba(216,180,160,0.28) 0%, rgba(215,122,97,0.14) 100%)',
        'auth-bg':    'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(216,180,160,0.18) 0%, transparent 60%)',
        'pastel-mesh': 'radial-gradient(ellipse at 20% 80%, rgba(216,180,160,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(219,211,216,0.25) 0%, transparent 50%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out both',
        'slide-up':   'slideUp 0.5s ease-out both',
        'float':      'float 7s ease-in-out infinite',
        'scale-in':   'scaleIn 0.28s ease-out both',
        'stagger-1':  'slideUp 0.5s ease-out 0.08s both',
        'stagger-2':  'slideUp 0.5s ease-out 0.18s both',
        'stagger-3':  'slideUp 0.5s ease-out 0.28s both',
        'stagger-4':  'slideUp 0.5s ease-out 0.38s both',
        'stagger-5':  'slideUp 0.5s ease-out 0.48s both',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'drift':      'drift 20s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(22px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:     { '0%, 100%': { transform: 'translateY(0)' },          '50%': { transform: 'translateY(-9px)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' },    to:   { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '0.6' },                       '50%': { opacity: '1' } },
        drift:     { from: { transform: 'translateX(0)' },                to: { transform: 'translateX(60px)' } },
      },
    },
  },
  plugins: [],
};

export default config;
