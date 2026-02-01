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
        // Obsidian Ballot palette
        obsidian: {
          50: '#F7F7F8',
          100: '#EDEDF0',
          200: '#D4D4DB',
          300: '#A9A9B8',
          400: '#75758A',
          500: '#52526A',
          600: '#3D3D54',
          700: '#2A2A3D',
          800: '#1A1A28',
          900: '#0F0F18',
          950: '#0A0C10',
        },
        gold: {
          50: '#FBF8F0',
          100: '#F5EED8',
          200: '#EBDDB1',
          300: '#DFC880',
          400: '#D4AF37', // Primary gold
          500: '#C9A227',
          600: '#A17F1E',
          700: '#7A5F17',
          800: '#5C4715',
          900: '#3D2F10',
        },
        ivory: {
          50: '#FEFDFB',
          100: '#FAF8F5',
          200: '#F5F2ED',
          300: '#EBE6DE',
          400: '#DDD5C8',
        },
        // Status colors
        ballot: {
          yes: '#2A7D4F',
          no: '#B83A3A',
          abstain: '#6B7280',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-lg': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'display-md': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'display-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
      },
      boxShadow: {
        'glow-gold': '0 0 40px -8px rgba(201, 162, 39, 0.35)',
        'glow-soft': '0 0 60px -12px rgba(0, 0, 0, 0.15)',
        'ballot': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-ballot': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'stamp': 'stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        stamp: {
          '0%': { transform: 'scale(0.8) rotate(-12deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'ballot': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
