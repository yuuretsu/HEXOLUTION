import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedTsRules = {
  'func-style': ['error', 'expression'],
  complexity: ['error', 10],
  '@typescript-eslint/consistent-type-imports': ['error', {
    prefer: 'type-imports',
    fixStyle: 'separate-type-imports',
  }],
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: ['variable', 'parameter', 'classProperty', 'typeProperty', 'accessor'],
      types: ['boolean'],
      format: ['PascalCase'],
      prefix: [
        'is', 'are', 'was', 'were', 'has', 'have', 'had',
        'can', 'could', 'should', 'did', 'will', 'needs',
      ],
    },
  ],
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
}

export default defineConfig([
  globalIgnores([
    'dist',
    'release',
    '**/node_modules/**',
    'packages/*/dist/**',
    'apps/*/dist/**',
  ]),
  {
    files: ['packages/**/*.{ts,tsx}', 'apps/web/src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: sharedTsRules,
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
  },
])
