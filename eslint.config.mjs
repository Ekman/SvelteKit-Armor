import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
	{ ignores: ['dist/**'] },
	js.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			globals: globals.node,
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,
		}
	},
	{
		files: ['**/*.test.ts'],
		languageOptions: {
			globals: globals.jest,
		}
	}
];
