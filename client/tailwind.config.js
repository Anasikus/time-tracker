/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // tailwind.config.js
  theme: {
    extend: {
      colors: {
        primary: '#6A0DAD', // фиолетовый
        dark: '#0d0d0d',    // черный
        light: '#ffffff',   // белый
        grayish: '#3a3a3a', // серый
        red: '#ff4c4c',
        green: '#4caf50',
        blue: '#2196f3',
        yellow: '#ffeb3b',
      }
    }
  },
  plugins: [],
}

