const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'android/*',
      'ios/*',
      '.superpowers/*',
    ],
  },
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    rules: {
      'import/first': 'off',
    },
  },
  {
    files: ['src/features/notifications/notificationService.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'expo',
                'expo/*',
                '../data/*',
                '../../data/*',
              ],
              message:
                'src/domain/ must stay pure TypeScript: no React, no Expo, no data-layer imports.',
            },
          ],
        },
      ],
    },
  },
];
