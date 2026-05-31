module.exports = {
  apps: [
    {
      name: 'pipolink-backend',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '500M',
      watch: false,
    },
  ],
};