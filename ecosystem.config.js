module.exports = {
  apps: [
    {
      name: 'financial-api',
      cwd: '/var/www/api/source',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
