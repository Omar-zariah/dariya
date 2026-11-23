import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#142B3B',
        cedar: '#0F2420',
        forest: {
          DEFAULT: '#0D604C',
          hover: '#094F3E',
          light: '#E8F5EE',
        },
        ivory: '#F7F8F4',
        sand: '#F7F5EF',
        terra: {
          DEFAULT: '#C87955',
          hover: '#B86A44',
          light: '#FDF3ED',
        },
        sage: '#82958A',
        gold: '#D4A373',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
