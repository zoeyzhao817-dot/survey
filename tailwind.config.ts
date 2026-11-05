import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2B2522',
        paper: '#FBF7F2',
        line: '#E8DFD5',
        muted: '#7A6E66',
        accent: '#A3324B',
      },
      fontFamily: {
        display: ['Fraunces', '"Noto Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
        sans: ['Inter', '"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
