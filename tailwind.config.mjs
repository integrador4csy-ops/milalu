/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        milalu: {
          pink: '#FF6B9D',
          'pink-m': '#FE8EC8',
          'pink-light': '#FFE4EE',
          'pink-dark': '#E24C7F',
          purple: '#A78BFA',
          'purple-light': '#EDE9FE',
          yellow: '#FFD93D',
          'yellow-light': '#FFF8D6',
          cyan: '#4ECDC4',
          'cyan-light': '#E0F7F5',
          coral: '#FF9F7D',
          'coral-light': '#FFE8DF',
          lavender: '#C7B8FF',
          dark: '#2D253A',
          muted: '#7A7285',
          cream: '#FFF9F6'
        }
      },
      fontFamily: {
        bubble: ['"Fredoka"', '"Baloo 2"', 'sans-serif'],
        sans: ['"Montserrat"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(255, 107, 157, 0.12)',
        'card': '0 4px 20px rgba(45, 37, 58, 0.06)',
        'button': '0 4px 15px rgba(255, 107, 157, 0.35)',
        'bottom-nav': '0 -4px 20px rgba(45, 37, 58, 0.08)'
      }
    },
  },
  plugins: [],
};
