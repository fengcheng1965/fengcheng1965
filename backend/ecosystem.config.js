module.exports = {
  apps: [{
    name: 'sushun-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    cron_restart: '0 3 * * *',
    log_file: './logs/pm2.log',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    shutdown_with_message: true,
    exp_backoff_restart_delay: 100,
    post_update: ['npm install', 'echo "Successfully pulled and updated"']
  }]
};