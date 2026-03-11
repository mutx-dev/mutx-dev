module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#030307',
        surface: '#0a0a0f',
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        amber: {
          400: '#fbbf24',
        },
        emerald: {
          400: '#34d399',
        },
        blue: {
          600: '#2563eb',
        },
        slate: {
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
        },
      },
      backgroundImage: {
        'cinematic-noir': 'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.15), transparent 50%), radial-gradient(ellipse at bottom_right, rgba(245, 158, 11, 0.1), transparent 40%), linear-gradient(180deg, #030307 0%, #0a0e17 100%)',
      },
      boxShadow: {
        panel: '0 20px 60px rgba(2, 6, 23, 0.34)',
        glow: '0 20px 60px rgba(34, 211, 238, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
