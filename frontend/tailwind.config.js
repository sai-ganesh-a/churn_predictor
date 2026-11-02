/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
        },
        border: {
          subtle: '#e2e8f0',
          strong: '#cbd5e1',
        },
        primary: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          muted: '#334155',
        },
        accent: {
          DEFAULT: '#0284c7', // restrained ocean blue
          hover: '#0369a1',
          subtle: '#f0f9ff',
        },
        risk: {
          high: '#e11d48',
          'high-bg': '#fff1f2',
          'high-border': '#fecdd3',
          medium: '#d97706',
          'medium-bg': '#fffbeb',
          'medium-border': '#fde68a',
          low: '#059669',
          'low-bg': '#ecfdf5',
          'low-border': '#a7f3d0',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
