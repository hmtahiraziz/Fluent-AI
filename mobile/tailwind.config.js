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
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#6366F1',
        },
        accent: {
          DEFAULT: '#06B6D4',
          dark: '#0891B2',
        },
        lavender: {
          DEFAULT: '#C4B5FD',
          soft: '#F5F3FF',
          muted: '#EDE9FE',
        },
        ocean: {
          DEFAULT: '#06B6D4',
          dark: '#0891B2',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        canvas: '#FFFFFF',
        mist: '#F5F3FF',
        border: '#E2E8F0',
        coral: '#EF4444',
        gold: '#F59E0B',
        success: '#10B981',
        nav: '#1E1B4B',
      },
      borderRadius: {
        '4xl': '2rem',
        sheet: '2rem',
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
