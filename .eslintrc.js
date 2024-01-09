module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	overrides: [],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: true,
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['react', '@typescript-eslint'],
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
		'@typescript-eslint/ban-types': [
			'error',
			{
				extendDefaults: true,
				types: {
					'{}': false,
				},
			},
		],

		// react, JSX related
		'jsx-quotes': ['warn', 'prefer-double'],
		'react/jsx-key': 'off',
		'react/no-find-dom-node': 'off',
		'react/no-unescaped-entities': 'off',
		'react/no-direct-mutation-state': 'off',
		'react/display-name': 'off',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
