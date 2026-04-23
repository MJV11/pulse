/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/flowbite-react/**/*.{js,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        pulse: {
          red: '#dc2626',
          'red-light': '#fef2f2',
          'red-border': '#fee2e2',
          'red-muted': '#5c403a',
          bg: '#fbf8ff',
          'msg-bg': '#f4f2ff',
        },
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
