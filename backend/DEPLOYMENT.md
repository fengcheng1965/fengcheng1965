# 苏顺植保后端系统部署文档

本文档详细说明如何在生产环境中部署苏顺植保后端API系统。

## 📋 目录

- [环境准备](#环境准备)
- [数据库配置](#数据库配置)
- [应用部署](#应用部署)
- [反向代理配置](#反向代理配置)
- [SSL证书配置](#ssl证书配置)
- [监控和日志](#监控和日志)
- [备份策略](#备份策略)
- [故障排查](#故障排查)

## 环境准备

### 服务器要求

**最低配置**:
- CPU: 2核
- 内存: 2GB
- 硬盘: 20GB SSD
- 操作系统: Ubuntu 20.04 LTS 或 CentOS 8+

**推荐配置**:
- CPU: 4核
- 内存: 4GB
- 硬盘: 50GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 软件依赖

#### 1. 安装Node.js

```bash
# 使用NodeSource安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### 2. 安装MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 验证安装
sudo mysql -u root -p
```

#### 3. 安装Nginx

```bash
sudo apt update
sudo apt install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
sudo systemctl status nginx
```

#### 4. 安装PM2

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 -v
```

## 数据库配置

### 1. 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE sushun_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建数据库用户
CREATE USER 'sushun_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# 授予权限
GRANT ALL PRIVILEGES ON sushun_db.* TO 'sushun_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 2. 配置MySQL优化

```bash
# 编辑MySQL配置文件
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

添加以下配置:

```ini
[mysqld]
# 基础配置
max_connections = 200
wait_timeout = 60
interactive_timeout = 60

# 性能优化
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

重启MySQL:

```bash
sudo systemctl restart mysql
```

## 应用部署

### 1. 创建项目目录

```bash
# 创建应用目录
sudo mkdir -p /var/www/sushun-api
sudo chown -R $USER:$USER /var/www/sushun-api

# 进入目录
cd /var/www/sushun-api
```

### 2. 克隆代码

```bash
git clone <your-repository-url> .

# 切换到生产分支
git checkout main
```

### 3. 安装依赖

```bash
# 安装生产依赖
npm install --production

# 验证依赖
npm list
```

### 4. 配置环境变量

```bash
# 创建环境变量文件
nano .env
```

配置内容:

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=sushun_user
DB_PASSWORD=your_secure_password
DB_NAME=sushun_db

# JWT配置（使用强密码）
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_key_at_least_32_characters
JWT_REFRESH_EXPIRES_IN=30d

# CORS配置
CORS_ORIGIN=https://www.sushunzhibao.com

# 日志配置
LOG_LEVEL=info

# 上传配置
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 5. 初始化数据库

```bash
# 初始化数据库表
node scripts/init-database.js

# 插入初始数据（可选）
node scripts/seed-data.js

# 验证数据库
mysql -u sushun_user -p sushun_db -e "SHOW TABLES;"
```

### 6. 使用PM2启动应用

```bash
# 启动应用
pm2 start server.js --name sushun-api

# 查看应用状态
pm2 status

# 查看日志
pm2 logs sushun-api

# 设置开机自启
pm2 startup
pm2 save

# 查看PM2配置
pm2 show sushun-api
```

### 7. 配置PM2生态系统文件（推荐）

```bash
# 创建生态系统配置文件
nano ecosystem.config.js
```

配置内容:

```javascript
module.exports = {
  apps: [{
    name: 'sushun-api',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
    cron_restart: '0 3 * * *',
    listen_timeout: 5000,
    kill_timeout: 5000
  }]
};
```

使用生态系统文件启动:

```bash
pm2 start ecosystem.config.js
```

## 反向代理配置

### 1. 配置Nginx

```bash
# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/sushun-api
```

配置内容:

```nginx
# API服务器配置
server {
    listen 80;
    server_name api.sushunzhibao.com;

    # 访问日志
    access_log /var/log/nginx/sushun-api-access.log;
    error_log /var/log/nginx/sushun-api-error.log;

    # 客户端最大上传大小
    client_max_body_size 10M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3000/api/;
    }
}
```

### 2. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/sushun-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 3. 配置防火墙

```bash
# 允许HTTP和HTTPS流量
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

## SSL证书配置

### 1. 使用Let's Encrypt免费证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.sushunzhibao.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 2. 配置SSL证书（手动）

如果已有SSL证书，配置如下:

```nginx
server {
    listen 443 ssl http2;
    server_name api.sushunzhibao.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 其他配置同上
    # ...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.sushunzhibao.com;
    return 301 https://$server_name$request_uri;
}
```

## 监控和日志

### 1. 应用监控

```bash
# PM2监控面板
pm2 web

# 查看应用指标
pm2 monit

# 查看详细信息
pm2 show sushun-api

# 查看日志
pm2 logs sushun-api --lines 100
pm2 logs sushun-api --err
```

### 2. 日志轮转

```bash
# 配置logrotate
sudo nano /etc/logrotate.d/sushun-api
```

配置内容:

```
/var/www/sushun-api/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs sushun-api > /dev/null 2>&1 || true
    endscript
}
```

### 3. 数据库监控

```bash
# 安装MySQL监控工具
sudo apt install mytop

# 查看MySQL进程
sudo mysqladmin -u root -p processlist

# 查看MySQL状态
sudo mysqladmin -u root -p status

# 查看慢查询日志
sudo tail -f /var/log/mysql/slow-query.log
```

## 备份策略

### 1. 数据库备份脚本

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-db.sh
```

脚本内容:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mysql"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="sushun_db"
DB_USER="sushun_user"
DB_PASS="your_secure_password"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "$DB_NAME_*.sql.gz" -mtime +7 -delete

# 记录日志
echo "$(date '+%Y-%m-%d %H:%M:%S') - 数据库备份完成: $DB_NAME_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

设置权限和定时任务:

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/backup-db.sh

# 测试脚本
/usr/local/bin/backup-db.sh

# 添加定时任务
sudo crontab -e

# 每天凌晨2点执行
0 2 * * * /usr/local/bin/backup-db.sh
```

### 2. 代码备份

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-code.sh
```

脚本内容:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/sushun-api"
DATE=$(date +"%Y%m%d_%H%M%S")
PROJECT_DIR="/var/www/sushun-api"

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/code_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='uploads' \
    --exclude='.git' \
    -C /var/www sushun-api

find $BACKUP_DIR -name "code_*.tar.gz" -mtime +30 -delete

echo "$(date '+%Y-%m-%d %H:%M:%S') - 代码备份完成: code_$DATE.tar.gz" >> $BACKUP_DIR/backup.log
```

设置定时任务:

```bash
sudo chmod +x /usr/local/bin/backup-code.sh

# 每周日凌晨3点执行
0 3 * * 0 /usr/local/bin/backup-code.sh
```

## 性能优化

### 1. 应用优化

```javascript
// 启用Gzip压缩
const compression = require('compression');
app.use(compression());

// 启用缓存
const expressStaticGzip = require('express-static-gzip');
app.use('/', expressStaticGzip('public', {
  enableBrotli: true,
  orderPreference: ['br', 'gz']
}));

// 连接池优化
const pool = mysql.createPool({
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true
});
```

### 2. 数据库优化

```sql
-- 添加索引
ALTER TABLE customers ADD INDEX idx_phone (phone);
ALTER TABLE messages ADD INDEX idx_status (status);
ALTER TABLE orders ADD INDEX idx_order_no (order_no);

-- 优化表
OPTIMIZE TABLE customers, messages, orders, products;

-- 分析表
ANALYZE TABLE customers, messages, orders, products;
```

### 3. Nginx优化

```nginx
# 工作进程数
worker_processes auto;

# 连接数
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# 缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
```

## 故障排查

### 常见问题

#### 1. 应用无法启动

```bash
# 查看PM2日志
pm2 logs sushun-api --err

# 检查端口占用
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000

# 检查环境变量
cat .env

# 手动启动测试
node server.js
```

#### 2. 数据库连接失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 检查数据库连接
mysql -u sushun_user -p sushun_db

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# 检查权限
ls -la /var/run/mysqld/
```

#### 3. Nginx配置错误

```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx

# 查看Nginx状态
sudo systemctl status nginx
```

#### 4. 内存不足

```bash
# 查看内存使用
free -h

# 查看进程内存
top
htop

# 重启应用
pm2 restart sushun-api

# 增加服务器内存或优化应用
```

### 应急恢复

```bash
# 从备份恢复数据库
zcat /var/backups/mysql/sushun_db_20260128_020000.sql.gz | mysql -u sushun_user -p sushun_db

# 恢复代码
tar -xzf /var/backups/sushun-api/code_20260128_030000.tar.gz -C /var/www/

# 重启所有服务
sudo systemctl restart mysql nginx
pm2 restart all
```

## 安全加固

### 1. 系统安全

```bash
# 禁用root登录
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# 配置防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 安装fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. 应用安全

```javascript
// 启用Helmet
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);
```

### 3. 数据库安全

```sql
# 删除匿名用户
DELETE FROM mysql.user WHERE User='';

# 删除测试数据库
DROP DATABASE IF EXISTS test;

# 刷新权限
FLUSH PRIVILEGES;
```

## 更新和维护

### 1. 应用更新

```bash
# 备份当前版本
pm2 stop sushun-api
cp -r /var/www/sushun-api /var/www/sushun-api.backup

# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production

# 重启应用
pm2 start sushun-api

# 验证
curl -I https://api.sushunzhibao.com/health
```

### 2. 回滚

```bash
# 停止当前版本
pm2 stop sushun-api

# 恢复备份
cp -r /var/www/sushun-api.backup /var/www/sushun-api

# 重启应用
pm2 start sushun-api
```

## 联系支持

如有问题，请联系技术支持:

- 邮箱: support@sushunzhibao.com
- 电话: 400-888-8888
- 工作时间: 周一至周五 9:00-18:00

---

**文档版本**: v1.0.0  
**最后更新**: 2026-01-28  
**维护团队**: 苏顺植保技术团队
