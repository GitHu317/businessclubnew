/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec5ff',
          400: '#59a3ff',
          500: '#3380fc',
          600: '#1c61f1',
          700: '#154ce0',
          800: '#173fb5',
          900: '#18398f',
          950: '#142457',
        },
        gold: {
          400: '#f0c44e',
          500: '#e0a82e',
          600: '#c08a1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(20, 36, 87, 0.08), 0 4px 24px -4px rgba(20, 36, 87, 0.06)',
      },
    },
  },
  plugins: [],
};
