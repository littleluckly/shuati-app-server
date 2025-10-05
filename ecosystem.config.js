module.exports = {
  apps: [
    {
      name: 'shuati-app-server',
      script: 'server.js',
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'raw-assets'],
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      combine_logs: true
    }
  ]
};