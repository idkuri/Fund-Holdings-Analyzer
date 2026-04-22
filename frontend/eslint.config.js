// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'

export default [
  js.configs.recommended, // includes ~50 essential rules

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    rules: {
      'react/jsx-uses-vars': 'error', // marks JSX component references as used

      // ── Possible Errors ──────────────────────────────────────
      'no-console': 'warn', // flag leftover console.logs
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-use-before-define': ['error', { functions: false }],

      // ── Best Practices ───────────────────────────────────────
      eqeqeq: ['error', 'always'], // always === not ==
      curly: ['error', 'all'], // braces even for 1-liners
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-assign': 'error',
      'no-throw-literal': 'error',
      'prefer-const': 'error', // const over let when possible
      'no-var': 'error', // ban var
      'object-shorthand': 'warn', // { foo } over { foo: foo }
      'no-else-return': 'warn',
      'default-case': 'warn', // switch needs a default
      'no-shadow': 'warn', // no variable shadowing

      // ── Style / Consistency ──────────────────────────────────
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn', // template literals > concatenation
      'spaced-comment': ['warn', 'always'],
    },
  },
]
