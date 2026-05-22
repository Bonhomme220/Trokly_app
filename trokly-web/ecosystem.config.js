/** @type {import('pm2').Config} */
module.exports = {
  apps: [
    {
      name: "trokly-web",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/trokly/trokly-web",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
