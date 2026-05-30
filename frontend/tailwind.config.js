/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#030712',
          850: '#0b0f19',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        primary: {
          500: '#6366f1',  // Indigo
          600: '#4f46e5',
          glow: '#06b6d4', // Cyan
        },
        secondary: {
          glow: '#d946ef', // Magenta
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-magenta': '0 0 20px rgba(217, 70, 239, 0.25)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'futuristic-grid': 'radial-gradient(circle, rgba(15, 23, 42, 0.8) 0%, rgba(3, 7, 18, 0.95) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
