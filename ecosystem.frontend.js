module.exports = {
  apps: [
    {
      name: 'rallyup-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3010',
      cwd: '/root/RallyUp_Web_Frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      error_file: '/root/.pm2/logs/rallyup-frontend-error.log',
      out_file: '/root/.pm2/logs/rallyup-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};