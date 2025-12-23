/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
				},
				// Vibrant accent colors
				accent: {
					blue: '#007AFF',
					purple: '#5856D6',
					pink: '#FF2D55',
					orange: '#FF9500',
					green: '#34C759',
					teal: '#5AC8FA',
					indigo: '#5856D6',
					red: '#FF3B30',
					yellow: '#FFCC00',
				},
				// Apple-inspired neutral palette
				'apple-gray': {
					50: '#fafafa',
					100: '#f5f5f7',
					200: '#e8e8ed',
					300: '#d2d2d7',
					400: '#86868b',
					500: '#6e6e73',
					600: '#515154',
					700: '#3a3a3c',
					800: '#2c2c2e',
					900: '#1c1c1e',
				},
			},
			fontFamily: {
				sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
			},
			borderRadius: {
				'apple': '10px',
				'apple-lg': '14px',
				'apple-xl': '18px',
			},
			boxShadow: {
				'apple-sm': '0 1px 4px 0 rgba(0, 0, 0, 0.05)',
				'apple': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
				'apple-lg': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
				'apple-xl': '0 8px 32px 0 rgba(0, 0, 0, 0.16)',
			},
			backdropBlur: {
				'apple': '40px',
			},
		},
	},
	darkMode: 'class',
	plugins: [],
}