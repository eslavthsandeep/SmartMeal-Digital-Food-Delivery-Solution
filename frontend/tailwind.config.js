/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        royal: {
          50:  '#FFFDF5',
          100: '#FFF9E0',
          200: '#FFF0B8',
          300: '#FFE17A',
          400: '#F5C842',
          500: '#DAA520',  // Goldenrod — primary
          600: '#B8860B',  // Dark Goldenrod
          700: '#8B6914',
          800: '#6B4F10',
          900: '#4A370B',
          950: '#2D2106',
        },
        surface: {
          50:  '#FFFDF7',  // Warm Ivory
          100: '#FFF8ED',
          200: '#F5F0E8',
          300: '#E8E0D4',
          400: '#D4C9B8',
        },
        noir: {
          50:  '#2A2A2A',
          100: '#1E1E1E',
          200: '#171717',
          300: '#121212',
          400: '#0D0D0D',
          500: '#080808',
          600: '#050505',
        },
        accent: {
          emerald: '#2D8A4E',
          rose:    '#BE185D',
          sky:     '#0284C7',
        },
        status: {
          success:  '#2D8A4E',
          warning:  '#D97706',
          danger:   '#C53030',
          info:     '#0284C7',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass':        '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark':   '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-gold':    '0 0 20px rgba(218, 165, 32, 0.25), 0 0 60px rgba(218, 165, 32, 0.1)',
        'glow-gold-sm': '0 0 10px rgba(218, 165, 32, 0.2)',
        'card':         '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)',
        'card-hover':   '0 8px 30px rgba(0,0,0,0.08), 0 0 20px rgba(218, 165, 32, 0.08)',
        'card-dark':    '0 1px 3px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.2)',
        'card-hover-dark': '0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(218, 165, 32, 0.12)',
        'btn':          '0 2px 8px rgba(184, 134, 11, 0.3)',
        'btn-hover':    '0 4px 16px rgba(218, 165, 32, 0.4)',
        'inner-glow':   'inset 0 1px 0 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'gold-gradient':     'linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #F5C842 100%)',
        'gold-gradient-r':   'linear-gradient(135deg, #F5C842 0%, #DAA520 50%, #B8860B 100%)',
        'dark-gradient':     'linear-gradient(180deg, #0D0D0D 0%, #171717 100%)',
        'dark-radial':       'radial-gradient(ellipse at top, #1E1E1E 0%, #0D0D0D 70%)',
        'hero-light':        'linear-gradient(135deg, #FFFDF7 0%, #FFF9E0 30%, #FFF0B8 100%)',
        'hero-dark':         'linear-gradient(135deg, #0D0D0D 0%, #171717 50%, #1E1E1E 100%)',
        'shimmer':           'linear-gradient(90deg, transparent 0%, rgba(218,165,32,0.06) 50%, transparent 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 8s ease-in-out infinite',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'slide-up':     'slide-up 0.4s ease-out',
        'slide-down':   'slide-down 0.3s ease-out',
        'slide-right':  'slide-right 0.4s ease-out',
        'fade-in':      'fade-in 0.3s ease-out',
        'fade-in-up':   'fade-in-up 0.5s ease-out',
        'scale-in':     'scale-in 0.3s ease-out',
        'shimmer-gold': 'shimmer-gold 2s infinite',
        'spin-slow':    'spin 3s linear infinite',
        'bounce-soft':  'bounce-soft 2s ease-in-out infinite',
        'pulse-soft':   'pulse-soft 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(218,165,32,0.15)' },
          '50%':      { boxShadow: '0 0 40px rgba(218,165,32,0.3)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer-gold': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.02)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
