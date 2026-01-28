# 生产环境部署文档
# 苏顺植保网站 - 生产部署
# 版本: 1.0.0
# 最后更新: 2026-01-29

## 目录

1. [概述](#概述)
2. [部署前准备](#部署前准备)
3. [环境配置](#环境配置)
4. [部署步骤](#部署步骤)
5. [部署验证](#部署验证)
6. [监控和维护](#监控和维护)
7. [故障排除](#故障排除)
8. [回滚方案](#回滚方案)

---

## 概述

### 系统架构

```
                    ┌─────────────────┐
                    │   用户浏览器    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CDN/负载均衡   │
                    └────────┬────────┘
                             │
              ┌────────────┼────────────┐
              │            │            │
       ┌────────▼────┐   │    ┌───────▼────────┐
       │  前端服务器   │   │    │  后端服务器集群   │
       │  (Nginx)    │   │    │  (PM2 Cluster) │
       └───────────────┘   │    └───────┬────────┘
                            │            │
                   ┌────────▼────────┘    │
                   │   Redis 缓存         │
                   └────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  MySQL 数据库    │
                   │  (主从复制)     │
                   └─────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|--------|------|------|------|
| **前端** | HTML5, CSS3, JavaScript | 用户界面 |
| **Web服务器** | Nginx 1.24+ | 反向代理、负载均衡 |
| **应用服务器** | Node.js 22.14+ | 后端API |
| **进程管理** | PM2 5.3+ | 进程守护、集群 |
| **数据库** | MySQL 8.0+ | 数据存储 |
| **缓存** | Redis 7.0+ | 会话、缓存 |
| **对象存储** | 阿里云OSS | 文件存储 |
| **监控** | Prometheus + Grafana | 性能监控 |
| **日志** | Winston + Sentry | 日志收集 |

---

## 部署前准备

### 1. 服务器要求

#### 最低配置（单节点）

| 资源 | 要求 |
|--------|------|
| **CPU** | 2核心 |
| **内存** | 4GB |
| **磁盘** | 50GB SSD |
| **带宽** | 10Mbps |
| **操作系统** | Ubuntu 20.04+ / CentOS 8+ |

#### 推荐配置（生产环境）

| 资源 | 要求 |
|--------|------|
| **CPU** | 4核心+ |
| **内存** | 8GB+ |
| **磁盘** | 100GB+ SSD |
| **带宽** | 50Mbps+ |
| **操作系统** | Ubuntu 22.04 LTS |

### 2. 软件依赖安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL 8.0
sudo apt install -y mysql-server mysql-client

# 安装 Redis
sudo apt install -y redis-server

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git

# 安装 AWS CLI (用于对象存储)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo mv aws /usr/local/bin/
sudo mv aws_completer /usr/local/share/

# 安装监控工具
sudo apt install -y prometheus-node-exporter grafana
```

### 3. 域名和SSL证书

#### 域名配置

```
主域名: sushunzb.com
子域名:
  - www.sushunzb.com (前端)
  - api.sushunzb.com (后端API)
  - admin.sushunzb.com (管理后台)
  - cdn.sushunzb.com (CDN)
  - monitor.sushunzb.com (监控)
```

#### SSL证书申请

```bash
# 使用 Let's Encrypt 免费证书
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d www.sushunzb.com -d api.sushunzb.com -d admin.sushunzb.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 数据库准备

```bash
# 创建数据库用户
mysql -u root -p <<EOF
CREATE USER 'sushun_prod_user'@'%' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON sushun_production.* TO 'sushun_prod_user'@'%';
FLUSH PRIVILEGES;
EOF

# 创建数据库
mysql -u sushun_prod_user -p <<EOF
CREATE DATABASE sushun_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# 导入初始数据
mysql -u sushun_prod_user -p sushun_production < /path/to/initial-data.sql
```

---

## 环境配置

### 1. 环境变量配置

```bash
# 复制生产环境配置模板
cd /var/www/sushun/backend
cp .env.production .env

# 编辑环境变量
nano .env
```

**必须配置的变量**:

```bash
# 服务器环境
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=sushun_prod_user
DB_PASSWORD=your-strong-password
DB_NAME=sushun_production

# JWT密钥 (必须生成新的)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# API地址
API_BASE_URL=https://api.sushunzb.com
FRONTEND_URL=https://www.sushunzb.com

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 对象存储配置
OSS_ACCESS_KEY_ID=your-oss-access-key-id
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
OSS_BUCKET=sushun-production

# 监控配置
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Nginx配置

```nginx
# /etc/nginx/sites-available/sushun-frontend.conf
server {
    listen 80;
    listen [::]:80;
    server_name www.sushunzb.com sushunzb.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.sushunzb.com sushunzb.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/www.sushunzb.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.sushunzb.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # 静态文件
    root /var/www/sushun/frontend;
    index index.html;
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
}
```

```nginx
# /etc/nginx/sites-available/sushun-api.conf
upstream sushun_backend {
    least_conn;
    server 127.0.0.1:3000 weight=3;
    server 127.0.0.1:3001 weight=2;
    server 127.0.0.1:3002 weight=1;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.sushunzb.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.sushunzb.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/api.sushunzb.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sushunzb.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    # 代理配置
    location / {
        proxy_pass http://sushun_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲区
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # 健康检查
    location /api/health {
        proxy_pass http://sushun_backend;
        access_log off;
    }
}
```

### 3. PM2配置

```bash
# 启动应用
cd /var/www/sushun/backend
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup systemd -u www-data --hp /var/www/sushun/backend
```

---

## 部署步骤

### 步骤1: 代码部署

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-repo/sushun-backend.git /var/www/sushun/backend
git clone https://github.com/your-repo/sushun-frontend.git /var/www/sushun/frontend

# 2. 切换到生产分支
cd /var/www/sushun/backend
git checkout production
git pull origin production

# 3. 安装依赖
npm ci --only=production

# 4. 构建前端 (如果需要)
cd /var/www/sushun/frontend
npm ci
npm run build

# 5. 设置权限
sudo chown -R www-data:www-data /var/www/sushun
sudo chmod -R 755 /var/www/sushun
sudo chmod 600 /var/www/sushun/backend/.env
```

### 步骤2: 数据库迁移

```bash
# 1. 备份当前数据库
./scripts/backup-database.sh

# 2. 执行数据库迁移
cd /var/www/sushun/backend
npm run migrate

# 3. 验证迁移结果
mysql -u sushun_prod_user -p sushun_production -e "SHOW TABLES;"
```

### 步骤3: 启动服务

```bash
# 1. 启动 Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 2. 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 3. 启动后端应用
cd /var/www/sushun/backend
pm2 start ecosystem.config.js --env production

# 4. 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 5. 验证服务状态
sudo systemctl status nginx
sudo systemctl status mysql
sudo systemctl status redis-server
pm2 status
```

### 步骤4: 配置防火墙

```bash
# 1. 允许SSH
sudo ufw allow 22/tcp

# 2. 允许HTTP
sudo ufw allow 80/tcp

# 3. 允许HTTPS
sudo ufw allow 443/tcp

# 4. 启用防火墙
sudo ufw enable

# 5. 查看防火墙状态
sudo ufw status
```

### 步骤5: 配置CDN

```bash
# 1. 上传静态资源到OSS
aws s3 sync /var/www/sushun/frontend/static s3://sushun-production/static/ \
  --region oss-cn-hangzhou \
  --exclude "*.html" \
  --exclude "*.js.map"

# 2. 配置CDN加速
# 在阿里云CDN控制台配置:
# - 源站: sushun-production.oss-cn-hangzhou.aliyuncs.com
# - 加速域名: cdn.sushunzb.com
# - 缓存规则: 静态资源30天，HTML文件1小时
```

---

## 部署验证

### 自动化验证

```bash
# 运行部署验证脚本
cd /var/www/sushun/backend
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

### 手动验证清单

#### 1. 基础服务验证

- [ ] Nginx 服务运行正常
- [ ] MySQL 服务运行正常
- [ ] Redis 服务运行正常
- [ ] PM2 应用运行正常
- [ ] 防火墙配置正确

#### 2. 网络访问验证

- [ ] 前端网站可访问: https://www.sushunzb.com
- [ ] 后端API可访问: https://api.sushunzb.com
- [ ] 健康检查正常: https://api.sushunzb.com/api/health
- [ ] SSL证书有效
- [ ] HTTPS重定向正常

#### 3. 功能验证

- [ ] 产品列表API正常
- [ ] 用户登录API正常
- [ ] 留言提交API正常
- [ ] 数据库连接正常
- [ ] Redis缓存正常

#### 4. 性能验证

- [ ] API响应时间 < 500ms
- [ ] 页面加载时间 < 2s
- [ ] 数据库查询时间 < 100ms
- [ ] 内存使用率 < 80%
- [ ] 磁盘使用率 < 80%

#### 5. 安全验证

- [ ] 安全头配置正确
- [ ] CORS配置正确
- [ ] 速率限制生效
- [ ] JWT认证正常
- [ ] 敏感信息未泄露

---

## 监控和维护

### 1. 监控系统

#### Prometheus配置

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sushun-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

#### Grafana仪表板

访问: https://monitor.sushunzb.com

默认凭据:
- 用户名: admin
- 密码: admin (首次登录后修改)

### 2. 日志管理

```bash
# 查看应用日志
pm2 logs sushun-backend --lines 100

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看MySQL日志
sudo tail -f /var/log/mysql/error.log

# 日志轮转
logrotate /etc/logrotate.d/sushun
```

### 3. 定期维护任务

```cron
# crontab -e

# 每天凌晨2点执行数据库备份
0 2 * * * /var/www/sushun/backend/scripts/backup-database.sh

# 每周日凌晨3点执行日志归档
0 3 * * 0 /var/www/sushun/backend/scripts/archive-logs.sh

# 每月1号凌晨4点执行数据库优化
0 4 1 * * /var/www/sushun/backend/scripts/optimize-database.sh

# 每小时检查服务状态
0 * * * * /var/www/sushun/backend/scripts/health-check.sh
```

---

## 故障排除

### 常见问题

#### 1. 应用无法启动

**症状**: PM2显示应用启动失败

**解决方案**:
```bash
# 检查日志
pm2 logs sushun-backend --err

# 检查端口占用
sudo netstat -tuln | grep :3000

# 检查环境变量
pm2 env sushun-backend

# 重启应用
pm2 restart sushun-backend
```

#### 2. 数据库连接失败

**症状**: 应用日志显示数据库连接错误

**解决方案**:
```bash
# 检查MySQL服务
sudo systemctl status mysql

# 测试数据库连接
mysql -h localhost -u sushun_prod_user -p

# 检查防火墙
sudo ufw status

# 检查MySQL配置
sudo cat /etc/mysql/my.cnf
```

#### 3. Nginx 502错误

**症状**: 访问网站时显示502 Bad Gateway

**解决方案**:
```bash
# 检查后端应用状态
pm2 status

# 检查Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 检查upstream配置
sudo cat /etc/nginx/sites-available/sushun-api.conf
```

#### 4. SSL证书问题

**症状**: 浏览器显示证书错误

**解决方案**:
```bash
# 检查证书有效期
sudo certbot certificates

# 续期证书
sudo certbot renew

# 重新加载Nginx
sudo systemctl reload nginx
```

---

## 回滚方案

### 1. 快速回滚

```bash
# 1. 停止当前版本
pm2 stop sushun-backend

# 2. 切换到上一个版本
cd /var/www/sushun/backend
git checkout HEAD~1

# 3. 恢复数据库
./scripts/restore-database.sh sushun_db_20260128_020000.sql.gz

# 4. 重启应用
pm2 start sushun-backend --env production

# 5. 验证回滚
./scripts/verify-deployment.sh
```

### 2. 完整回滚

```bash
# 1. 恢复完整备份
./scripts/restore-application.sh v1.0.0

# 2. 恢复数据库备份
./scripts/restore-database.sh sushun_db_20260127_020000.sql.gz

# 3. 恢复配置备份
./scripts/restore-config.sh

# 4. 重启所有服务
sudo systemctl restart nginx mysql redis-server
pm2 restart all

# 5. 全面验证
./scripts/verify-deployment.sh
```

---

## 总结

### 部署检查清单

- [ ] 服务器准备完成
- [ ] 软件依赖安装完成
- [ ] 域名和SSL配置完成
- [ ] 数据库准备完成
- [ ] 环境变量配置完成
- [ ] Nginx配置完成
- [ ] PM2配置完成
- [ ] 代码部署完成
- [ ] 数据库迁移完成
- [ ] 服务启动完成
- [ ] 防火墙配置完成
- [ ] CDN配置完成
- [ ] 部署验证通过
- [ ] 监控系统配置完成
- [ ] 备份策略配置完成

### 联系信息

**技术支持**: tech@sushunzb.com  
**紧急联系**: 13800138000  
**文档地址**: https://docs.sushunzb.com

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-29  
**维护人员**: DevOps Team
