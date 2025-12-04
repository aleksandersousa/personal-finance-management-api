module.exports = {
  apps: [
    {
      name: 'financial-api',
      cwd: '/var/www/financial-management/api/source',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'financial-api-worker',
      cwd: '/var/www/financial-management/api/source',
      script: 'dist/src/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        IS_WORKER: 'true',
      },
      // Optional: Restart worker on failure
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Optional: Log configuration
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
