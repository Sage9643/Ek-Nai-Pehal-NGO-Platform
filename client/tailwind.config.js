/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0F4C2A',
          dark: '#0A3820',
          light: '#1a7a47',
        },
        saffron: {
          DEFAULT: '#F97316',
          dark: '#ea6c0a',
          light: '#fed7aa',
        },
        ivory: '#FAFAF7',
        primary: '#0F4C2A',
        'primary-dark': '#0A3820',
        amber: '#F97316',
        sky: '#0EA5E9',
        text: '#1E293B',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80')",
      },
    },
  },
  plugins: [],
};
