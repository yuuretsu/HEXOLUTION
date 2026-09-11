import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypeAssertion',
          message: 'Type assertions are forbidden. Prefer proper typing or type guards.',
        },
        {
          selector: 'TSAsExpression:not([typeAnnotation.typeName.name="const"])',
          message: 'Type assertions (`as`) are forbidden, except `as const`.',
        },
      ],
    },
  },
])
