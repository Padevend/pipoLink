module.exports = {
  apps: [
    {
      name: 'pipolink-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0'
      },
      max_memory_restart: '500M',
      watch: false,
    },
  ],
};