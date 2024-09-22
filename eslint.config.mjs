import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:unicorn/recommended'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.eslint.json',
        parser: '@typescript-eslint/parser'
      }
    },

    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off'
    }
  },
  {
    ignores: ['index.d.ts', 'src/plugins/types.js', 'unit/test/fixtures/**']
  }
]
