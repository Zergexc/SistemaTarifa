/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1e293b',
          fg: '#94a3b8',
          'fg-active': '#ffffff',
          active: '#2563eb',
          hover: '#334155',
          border: '#334155',
        },
        brand: {
          blue: '#1d4ed8',
          'blue-hover': '#1e40af',
        },
      },
    },
  },
  plugins: [],
}
