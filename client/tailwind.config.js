/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cream': '#FFF8F1',
                'beige': '#F4E8DA',
                'soft-rose': '#F8DDE5',
                'lavender': '#FFE8EE',
                'blush': '#D37E91',
                'dark-blush': '#A55D6A',
            },
        },
    },
    plugins: [],
}
