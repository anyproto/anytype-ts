const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const globals = require('globals');

module.exports = tseslint.config(
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'tools/**',
			'extension/**',
			'*.config.js',
			'*.config.mjs',
			'*.js',
			'electron/**',
			'scripts/**',
			'src/json/schema/**',
			'licenses.json',
			'**/*.d.ts',
			'*-arm64/**',
			'windows/**',
		],
	},
	{
		files: ['src/**/*.{ts,tsx}'],
		extends: [
			...tseslint.configs.recommended,
		],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
			parser: tseslint.parser,
			parserOptions: {
				project: true,
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			'react': reactPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'prefer-const': 'warn',
			'semi': ['warn', 'always'],
			'quotes': [
				'warn',
				'single',
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				}
			],
			'no-mixed-spaces-and-tabs': 'warn',
			'no-multi-spaces': 'warn',
			'no-unsafe-optional-chaining': 'warn',
			'no-useless-escape': 'off',
			'no-empty': 'off',
			'no-fallthrough': 'off',
			'no-case-declarations': 'off',
			'no-console': 'off',
			'no-var': 'warn',
			'no-extra-semi': 'off',

			// unused vars
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'off',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],

			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-extra-semi': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-empty-interface': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/ban-types': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',

			// react, JSX related
			'jsx-quotes': ['warn', 'prefer-double'],
			'react/jsx-key': 'off',
			'react/no-find-dom-node': 'off',
			'react/no-unescaped-entities': 'off',
			'react/no-direct-mutation-state': 'off',
			'react/display-name': 'off',
			'react/prop-types': 'off',
		},
	},
);
