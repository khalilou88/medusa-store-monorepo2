import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Global settings
  {
    plugins: {
      prettier: prettierPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Storefront-specific configuration
  {
    files: ['storefront/**/*'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // E2E-specific configuration
  {
    files: ['e2e/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      '**/node_modules/',
      'dist/',
      '**/dist/',
      'build/',
      '**/build/',
      'coverage/',
      '**/coverage/',
      '.next/',
      '.nuxt/',
      '*.min.js',
      '*.min.css',
    ],
  }
);
