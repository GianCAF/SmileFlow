/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cream': '#FFFAF4',
                'warm': '#F8EADC',
                'beige': '#EAD7C5',
                'soft-rose': '#F7D6DF',
                'lavender': '#FCE8EE',
                'blush': '#EAA0B3',
                'dark-blush': '#B96A80',
            },
        },
    },
    plugins: [],
}
