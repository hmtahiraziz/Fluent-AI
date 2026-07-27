/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      screens: {
        sm: '380px',
        md: '600px',
        lg: '900px',
      },
      colors: {
        brand: {
          DEFAULT: '#453e7f',
          dark: '#190e52',
          light: '#5d5699',
          soft: '#e4dfff',
          container: '#5d5699',
        },
        accent: {
          DEFAULT: '#9084F8',
          pill: '#bcb4ff',
          dark: '#4233a5',
        },
        secondary: {
          DEFAULT: '#5a4dbe',
          container: '#9589fe',
          onContainer: '#2b158f',
        },
        lavender: {
          DEFAULT: '#9589fe',
          soft: '#fcf9f8',
          muted: '#f0edec',
        },
        ink: {
          DEFAULT: '#1b1c1b',
          muted: '#474550',
          faint: '#787581',
        },
        canvas: '#fcf9f8',
        mist: '#fcf9f8',
        surface: {
          DEFAULT: '#ffffff',
          container: '#f0edec',
          containerLow: '#f6f3f2',
          containerHighest: '#e4e2e1',
        },
        border: '#c9c4d1',
        coral: '#ba1a1a',
        gold: '#F59E0B',
        success: '#10B981',
        insight: '#FDF3D6',
        nav: '#1b1c1b',
      },
      borderRadius: {
        card: '24px',
        '4xl': '1.75rem',
        sheet: '1.75rem',
      },
      maxWidth: {
        content: '480px',
        contentLg: '640px',
        contentXl: '800px',
      },
    },
  },
  plugins: [],
};
