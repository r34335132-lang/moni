/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: '#FAFAFA', dark: '#0A0A0A' },
        foreground: { DEFAULT: '#0A0A0A', dark: '#F5F5F5' },
        card: { DEFAULT: '#FFFFFF', dark: '#141414' },
        primary: { DEFAULT: '#22C55E', dark: '#22C55E' },
        secondary: { DEFAULT: '#F3F3F3', dark: '#1A1A1A' },
        muted: { DEFAULT: '#8A8A8A', dark: '#686868' },
        destructive: { DEFAULT: '#EF4444', dark: '#EF4444' },
        border: { DEFAULT: '#EBEBEB', dark: '#1F1F1F' },
        accent: { DEFAULT: '#F0FBF4', dark: '#0F2B1A' },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
