/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './constants/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Obviously-Regular', 'sans-serif'],
				pitalic: ['Obviously-RegularItalic', 'sans-serif'],
				pregular: ['Obviously-Regular', 'sans-serif'],
				pmedium: ['Obviously-Medium', 'sans-serif'],
				psemibold: ['Obviously-SemiBold', 'sans-serif'],
				pbold: ['Obviously-Bold', 'sans-serif'],
				pblack: ['Obviously-Black', 'sans-serif']
			},
			colors: {
				primary: {
					DEFAULT: '#4655E0',
					dark: '#6D7CFF',
				},
				habitYellow: {
					DEFAULT: '#f7cd63',
					bgLight: '#fdf8e6',
					bgDark: '#3b321a',
					textLight: '#8c6b14',
					textDark: '#fce296',
					borderLight: '#fae39e',
					borderDark: '#7a621c',
				},
				habitPink: {
					DEFAULT: '#fc87c6',
					bgLight: '#fef0f7',
					bgDark: '#3d1a2d',
					textLight: '#9e2365',
					textDark: '#fdbde1',
					borderLight: '#fdb1da',
					borderDark: '#852d5b',
				},
				habitBlue: {
					DEFAULT: '#a3c7fe',
					bgLight: '#f0f5ff',
					bgDark: '#19273d',
					textLight: '#265cb3',
					textDark: '#d1e3ff',
					borderLight: '#cce0ff',
					borderDark: '#325182',
				},
				habitGreen: {
					DEFAULT: '#b8eb6c',
					bgLight: '#f4fce8',
					bgDark: '#223311',
					textLight: '#4e7314',
					textDark: '#d7f5a6',
					borderLight: '#d7f4a1',
					borderDark: '#436615',
				},
				habitOrange: {
					DEFAULT: '#ff8d4d',
					bgLight: '#fff2eb',
					bgDark: '#3d1d0c',
					textLight: '#993f0a',
					textDark: '#ffc29e',
					borderLight: '#ffbfa1',
					borderDark: '#803910',
				},
				habitCyan: {
					DEFAULT: '#aae8e7',
					bgLight: '#effbfb',
					bgDark: '#163332',
					textLight: '#237371',
					textDark: '#d0f4f3',
					borderLight: '#cbf2f1',
					borderDark: '#2a6665',
				},
			},
		},
	},
	presets: [require("nativewind/preset")],
	plugins: [],
}
