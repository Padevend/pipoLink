module.exports = {
  apps: [
    {
      name: 'pipolink-backend',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 5000,
      kill_timeout: 5000,
    },
  ],
};