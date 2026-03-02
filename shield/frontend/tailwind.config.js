/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                shield: {
                    bg: '#0f172a',
                    card: '#1e293b',
                    accent: '#38bdf8',
                },
            },
        },
    },
    plugins: [],
};
