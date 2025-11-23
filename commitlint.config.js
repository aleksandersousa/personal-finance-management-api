module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code refactoring
        'test', // Adding tests
        'chore', // Maintenance
        'perf', // Performance improvements
        'ci', // CI configuration
        'build', // Build system
        'revert', // Revert changes
      ],
    ],
  },
};
