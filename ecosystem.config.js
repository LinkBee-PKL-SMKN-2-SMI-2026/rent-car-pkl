module.exports = {
  apps: [
    {
      name: 'rent-car-app-be',
      script: './src/app/index.ts',
      interpreter: 'bun',
      cwd: '/var/www/rent-car-pkl',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/www/rent-car-pkl/logs/pm2.out.log',
      error_file: '/var/www/rent-car-pkl/logs/pm2.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
