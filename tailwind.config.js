/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: 'color-mix(in srgb, var(--accent-color) 10%, white)',
					100: 'color-mix(in srgb, var(--accent-color) 20%, white)',
					200: 'color-mix(in srgb, var(--accent-color) 40%, white)',
					300: 'color-mix(in srgb, var(--accent-color) 60%, white)',
					400: 'color-mix(in srgb, var(--accent-color) 80%, white)',
					500: 'var(--accent-color)',
					600: 'color-mix(in srgb, var(--accent-color) 80%, black)',
					700: 'color-mix(in srgb, var(--accent-color) 60%, black)',
					800: 'color-mix(in srgb, var(--accent-color) 40%, black)',
					900: 'color-mix(in srgb, var(--accent-color) 20%, black)',
				},
			},
		},
	},
	darkMode: 'class',
	plugins: [],
}