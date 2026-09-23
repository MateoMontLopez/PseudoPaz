/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Menlo', 'monospace'],
      },
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#121215',    // Zinc 900 custom
        'surface-subtle': '#18181b', // Zinc 900
        border: '#27272a',     // Zinc 800
        'border-focus': '#3f3f46', // Zinc 700
      },
    },
  },
  plugins: [],
};
