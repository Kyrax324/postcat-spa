import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'
import typescript from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
	...vue.configs['flat/recommended'],
	{
		ignores: [
			'node_modules/',
			'dist/',
			'build/',
			'coverage/',
			'public/',
			'*.min.js',
			'*.min.css',
		],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: {
				window: 'readonly',
				document: 'readonly',
				__DEV_MODE__: 'readonly',
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		rules: {
			indent: ['error', 'tab'],
			'no-console': 'off',
			'no-unused-vars': 'off',
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
		languageOptions: {
			parser: tsParser,
		},
		plugins: {
			'@typescript-eslint': typescript,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'warn',
			'no-unused-vars': 'off',
		},
	},
	{
		files: ['**/*.js'],
		rules: {
			'no-unused-vars': 'warn',
		},
	},
	prettier,
	{
		files: ['**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tsParser,
				ecmaVersion: 2021,
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},
		},
		rules: {
			'vue/html-indent': ['error', 'tab'],
			'vue/first-attribute-linebreak': ['error', { singleline: 'ignore', multiline: 'below' }],
			'vue/mustache-interpolation-spacing': ['error', 'always'],
			'vue/html-closing-bracket-newline': [
				'error',
				{
					singleline: 'never',
					multiline: 'always',
				},
			],
			'vue/singleline-html-element-content-newline': 'off',
			'vue/max-attributes-per-line': ['error', { singleline: 1, multiline: 1 }],
			'vue/multi-word-component-names': 'off',
		},
	},
]