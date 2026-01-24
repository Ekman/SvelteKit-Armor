/** @type {import('@typescript-eslint/utils').JSONSchema4Object} */
export default {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'prettier'
	],
};
