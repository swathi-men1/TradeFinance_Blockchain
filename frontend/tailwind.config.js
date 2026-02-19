/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
/**
 * Functional Requirements Specification (FRS)
 * Project: Trade Finance Blockchain Explorer
 * Developer: Abdul Samad
 * @type {import('tailwindcss').Config}
 */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 8s linear infinite',
                'reverse-spin': 'spin 8s linear infinite reverse',
                'float': 'float 3s ease-in-out infinite',
                'float-delayed': 'float 3s ease-in-out 1.5s infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
