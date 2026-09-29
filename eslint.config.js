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
