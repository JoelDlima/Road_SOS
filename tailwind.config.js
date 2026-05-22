/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#13161B',
        surface2: '#1C2128',
        border: 'rgba(255,255,255,0.08)',
        'sos-red': '#FF3B30',
        'sos-glow': 'rgba(255,59,59,0.25)',
        'safe-green': '#34C759',
        'warn-amber': '#FF9F0A',
        'info-blue': '#0A84FF',
        'text-primary': '#F2F2F7',
        'text-muted': '#8E8E93',
        'text-faint': '#6E6E73',
        indigo: '#5E5CE6',
      },
      fontFamily: {
        mono: ['monospace'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
      },
    },
  },
  plugins: [],
};
