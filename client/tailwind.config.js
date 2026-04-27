/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'lavender': '#FFE8EE',
                'blush': '#D37E91',
                'dark-blush': '#A55D6A',
            },
        },
    },
    plugins: [],
}