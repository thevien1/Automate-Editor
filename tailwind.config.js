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
        primary: {
          DEFAULT: '#1890ff',
          hover: '#40a9ff',
          active: '#096dd9',
          light: '#e6f7ff',
        },
        gpm: {
          blue: '#1677ff',
          dark: '#141414',
          sidebar: '#f5f7fa',
          border: '#e8e8e8',
          card: '#ffffff',
          text: '#262626',
          secondary: '#8c8c8c',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
