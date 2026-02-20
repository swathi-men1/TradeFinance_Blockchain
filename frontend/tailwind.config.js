/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            backgroundColor: {
                'light': '#F8F9FA',
                'light-secondary': '#E8EAED',
            },
            textColor: {
                'dark-text': '#1A1A2E',
                'dark-text-secondary': '#5F6368',
                'dark-text-muted': '#9AA0A6',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 20s linear infinite',
                'reverse-spin': 'reverseSpin 15s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 2s infinite',
                'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                fadeInUp: {
                    '0%': { 
                        opacity: '0',
                        transform: 'translateY(20px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                reverseSpin: {
                    'from': { transform: 'rotate(360deg)' },
                    'to': { transform: 'rotate(0deg)' }
                }
            }
        },
    },
    plugins: [],
}
