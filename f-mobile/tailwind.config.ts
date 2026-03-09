import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        secondary: '#0f766e',
        accent: '#f59e0b',
        danger: '#dc2626',
        success: '#16a34a',
        warning: '#ea580c',
      },
    },
  },
  plugins: [],
}
export default config
