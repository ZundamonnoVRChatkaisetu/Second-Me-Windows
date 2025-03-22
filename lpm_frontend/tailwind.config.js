/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          dark: 'var(--secondary-color)',
        },
        secondary: {
          DEFAULT: 'var(--accent-color)',
        },
        // ダークモード用のカスタム色を追加
        background: {
          light: 'var(--background-light)',
          dark: 'var(--background-dark)'
        },
        foreground: {
          light: 'var(--foreground-light)',
          dark: 'var(--foreground-dark)'
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  // 'class'に変更することで、classに基づいてダークモードを切り替え
  darkMode: 'class',
};
