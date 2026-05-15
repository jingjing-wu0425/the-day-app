/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F9F9F9',
        fg: '#1A1A1A',
        muted: '#999999',
        accent: '#6B7280',
        card: '#FFFFFF',
        border: '#E5E5E5',
      },
    },
  },
  plugins: [],
};
