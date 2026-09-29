const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    // The single most important structural rule in this project: `src/domain/`
    // stays pure TypeScript so the date maths is testable without a device and
    // reusable by the future native Android widget.
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
                'src/domain/ must stay pure TypeScript: no React, no Expo, no data-layer imports. This keeps the date maths testable and reusable by the future native widget.',
            },
          ],
        },
      ],
    },
  },
];
