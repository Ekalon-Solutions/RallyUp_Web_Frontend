module.exports = {
  apps: [
    {
      name: 'rallyup-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/RallyUp_Web_Frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      error_file: '/root/logs/rallyup-frontend-error.log',
      out_file: '/root/logs/rallyup-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};