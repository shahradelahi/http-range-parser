import { defineConfig } from '@shahrad/eslint-config';

export default defineConfig(
  {
    ignores: ['dist/**'],
  },

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'error',
    },
  }
);
