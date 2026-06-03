/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cream': '#FFF7EA',
                'warm': '#FFD9BC',
                'beige': '#F1CBAE',
                'soft-rose': '#FFD1DC',
                'lavender': '#FFE6EC',
                'blush': '#FF6F91',
                'dark-blush': '#B83B5E',
            },
        },
    },
    plugins: [],
}
