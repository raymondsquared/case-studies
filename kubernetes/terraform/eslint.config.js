const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    files: ['src/**/*.ts', '**/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    extends: [...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      'no-console': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      quotes: ['error', 'single'],
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      '.gen',
      'cdktf.out',
      'coverage',
      'scripts',
      '**/*.js',
      '**/*.d.ts',
    ],
  },
  prettier
);
