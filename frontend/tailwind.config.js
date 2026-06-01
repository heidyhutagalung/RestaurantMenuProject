/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF8F0',
          100: '#FFE8C8',
          200: '#FFD09A',
          300: '#FFB366',
          400: '#FF9A3C',
          500: '#FF7B00',
          600: '#E06500',
          700: '#B84F00',
          800: '#8A3A00',
          900: '#5C2600',
        },
        dark: {
          900: '#0D0D0D',
          800: '#161616',
          700: '#1E1E1E',
          600: '#272727',
          500: '#333333',
          400: '#4A4A4A',
          300: '#666666',
          200: '#999999',
          100: '#CCCCCC',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(24px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn: { '0%': { transform: 'scale(0.85)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    }
  },
  plugins: [],
}
