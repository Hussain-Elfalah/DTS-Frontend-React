/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // blue-500
        secondary: "#6b7280", // gray-500
        success: "#10b981", // green-500
        warning: "#f59e0b", // amber-500
        danger: "#ef4444", // red-500
        info: "#3b82f6", // blue-500
        background: "#f9fafb", // gray-50
        text: "#1f2937", // gray-800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        sm: '0.125rem', // 2px
        md: '0.25rem', // 4px
        lg: '0.5rem', // 8px
        xl: '1rem', // 16px
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
} 