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
                'warm': '#F7E6D4',
                'beige': '#ECD8C4',
                'soft-rose': '#F8DDE5',
                'lavender': '#FFE8EE',
                'blush': '#D37E91',
                'dark-blush': '#A55D6A',
            },
        },
    },
    plugins: [],
}
