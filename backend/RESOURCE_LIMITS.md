# 资源限制和性能参数配置
# 苏顺植保网站 - 性能配置
# 版本: 1.0.0

## 概述

本文档描述了苏顺植保项目的资源限制和性能参数配置，确保系统稳定运行和性能优化。

---

## 1. Node.js 性能配置

### 1.1 内存管理

```javascript
// config/performance.js
const performanceConfig = {
  // Node.js 内存限制
  nodeMaxOldSpaceSize: parseInt(process.env.NODE_MAX_OLD_SPACE_SIZE) || 2048, // MB
  nodeMaxSemiSpaceSize: parseInt(process.env.NODE_MAX_SEMI_SPACE_SIZE) || 128, // MB
  
  // V8 引擎优化
  v8Flags: [
    '--max-old-space-size=2048',
    '--optimize-for-size',
    '--gc-interval=100'
  ],
  
  // 垃圾回收优化
  gcInterval: 100, // ms
  gcMaxHeapSize: 2048 * 1024 * 1024 // bytes
};

// 设置 Node.js 内存限制
if (performanceConfig.nodeMaxOldSpaceSize) {
  const v8 = require('v8');
  v8.setFlagsFromString(`--max-old-space-size=${performanceConfig.nodeMaxOldSpaceSize}`);
}

module.exports = performanceConfig;
```

### 1.2 请求限制配置

```javascript
// middleware/rate-limiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    })
  }),
  windowMs: parseInt(process.env.REQUEST_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.REQUEST_RATE_LIMIT_MAX) || 100, // 每个IP最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 秒
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  // 白名单
  skip: (req) => {
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];
    const clientIp = req.ip || req.connection.remoteAddress;
    return whitelist.includes(clientIp);
  }
});

// API 特定速率限制
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟30个请求
  message: {
    success: false,
    message: 'API请求过于频繁',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

// 登录速率限制
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 15分钟内最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true
});

module.exports = {
  rateLimiter,
  apiRateLimiter,
  loginRateLimiter
};
```

---

## 2. 数据库连接池配置

### 2.1 MySQL 连接池

```javascript
// config/database-pool.js
const mysql = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // 连接池大小
  connectionLimit: parseInt(process.env.DB_POOL_MAX) || 20,
  waitForConnections: true,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  
  // 连接超时
  connectTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  
  // 连接保活
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // 字符集
  charset: 'utf8mb4',
  timezone: '+08:00',
  
  // SSL 配置
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  
  // 调试模式
  debug: process.env.DB_DEBUG === 'true' ? true : false
};

const pool = mysql.createPool(poolConfig);

// 连接池监控
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

module.exports = pool;
```

### 2.2 连接池健康检查

```javascript
// utils/pool-health.js
async function checkPoolHealth(pool) {
  const connection = await pool.getConnection();
  const startTime = Date.now();
  
  try {
    await connection.ping();
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency,
      pool: {
        total: pool.pool._allConnections.length,
        active: pool.pool._allConnections.length - pool.pool._freeConnections.length,
        idle: pool.pool._freeConnections.length,
        waiting: pool.pool._connectionQueue.length
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      pool: {
        total: pool.pool._allConnections.length,
        active: pool.pool._allConnections.length - pool.pool._freeConnections.length,
        idle: pool.pool._freeConnections.length,
        waiting: pool.pool._connectionQueue.length
      }
    };
  } finally {
    connection.release();
  }
}

module.exports = {
  checkPoolHealth
};
```

---

## 3. 缓存配置

### 3.1 Redis 缓存

```javascript
// config/cache.js
const Redis = require('ioredis');
const NodeCache = require('node-cache');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  
  // 连接池
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // 超时配置
  connectTimeout: 10000,
  lazyConnect: false,
  
  // 重连策略
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

const redis = new Redis(redisConfig);

// 内存缓存（作为 Redis 的后备）
const memoryCache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1小时
  checkperiod: 600, // 10分钟
  useClones: false,
  maxKeys: parseInt(process.env.CACHE_MAX_SIZE) || 1000
});

// 缓存工具函数
async function get(key) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    // 降级到内存缓存
    return memoryCache.get(key);
  }
}

async function set(key, value, ttl = 3600) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    // 同时设置内存缓存
    memoryCache.set(key, value, ttl);
  } catch (error) {
    // 降级到内存缓存
    memoryCache.set(key, value, ttl);
  }
}

async function del(key) {
  try {
    await redis.del(key);
    memoryCache.del(key);
  } catch (error) {
    memoryCache.del(key);
  }
}

async function flush() {
  try {
    await redis.flushdb();
    memoryCache.flushAll();
  } catch (error) {
    memoryCache.flushAll();
  }
}

module.exports = {
  redis,
  memoryCache,
  get,
  set,
  del,
  flush
};
```

### 3.2 缓存中间件

```javascript
// middleware/cache.js
const { get, set } = require('../config/cache');

function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      const cached = await get(cacheKey);
      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cached);
      }
      
      console.log(`Cache miss: ${cacheKey}`);
      
      // 拦截响应
      const originalJson = res.json;
      res.json = function(data) {
        set(cacheKey, data, ttl);
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
}

function clearCache(pattern) {
  return async (req, res, next) => {
    try {
      const { redis } = require('../config/cache');
      const keys = await redis.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      next();
    } catch (error) {
      console.error('Clear cache error:', error);
      next();
    }
  };
}

module.exports = {
  cacheMiddleware,
  clearCache
};
```

---

## 4. 请求超时配置

### 4.1 超时中间件

```javascript
// middleware/timeout.js
const timeout = require('connect-timeout');

const timeoutConfig = {
  // 请求超时时间
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30秒
  
  // 数据库查询超时
  dbQueryTimeout: 10000, // 10秒
  
  // 外部 API 调用超时
  externalApiTimeout: 5000, // 5秒
  
  // 文件上传超时
  uploadTimeout: 60000 // 60秒
};

function haltOnTimedOut(req, res, next) {
  if (!req.timedout) return next();
  
  console.error(`Request timeout: ${req.method} ${req.url}`);
  res.status(408).json({
    success: false,
    message: '请求超时',
    code: 'REQUEST_TIMEOUT'
  });
}

module.exports = {
  timeoutConfig,
  haltOnTimedOut
};
```

---

## 5. 文件上传限制

### 5.1 Multer 配置

```javascript
// config/upload.js
const multer = require('multer');
const path = require('path');

const uploadConfig = {
  // 文件大小限制
  fileSize: parseInt(process.env.FILE_UPLOAD_MAX_SIZE) || 5242880, // 5MB
  
  // 允许的文件类型
  allowedTypes: (process.env.FILE_UPLOAD_ALLOWED_TYPES || 
    'image/jpeg,image/png,image/gif,application/pdf').split(','),
  
  // 存储配置
  storage: multer.memoryStorage(),
  
  // 文件名生成
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
};

// 文件类型验证
function fileFilter(req, file, cb) {
  const allowedTypes = uploadConfig.allowedTypes;
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  if (allowedTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${mimeType}`), false);
  }
}

const upload = multer({
  storage: uploadConfig.storage,
  limits: {
    fileSize: uploadConfig.fileSize,
    files: 10 // 最多10个文件
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  uploadConfig
};
```

---

## 6. 性能监控

### 6.1 性能指标收集

```javascript
// middleware/performance-metrics.js
const { recordHttpRequest } = require('../config/prometheus');

function performanceMetrics(req, res, next) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // 记录性能指标
    recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration / 1000
    );
    
    // 记录慢查询
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // 记录内存使用
    if (memoryDelta > 10 * 1024 * 1024) { // 超过10MB
      console.warn(`High memory usage: ${req.method} ${req.path} - ${memoryDelta} bytes`);
    }
  });
  
  next();
}

module.exports = {
  performanceMetrics
};
```

---

## 7. PM2 进程管理配置

### 7.1 PM2 配置文件

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sushun-backend',
    script: './server.js',
    instances: parseInt(process.env.PM2_INSTANCES) || 2,
    exec_mode: 'cluster',
    
    // 资源限制
    max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 监控配置
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git'
    ],
    
    // 自动重启
    autorestart: true,
    watch_delay: 1000,
    
    // 进程管理
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // 健康检查
    health_check_grace_period: 3000,
    health_check_interval: 10000,
    health_check_uri: 'http://localhost:3000/api/health'
  }]
};
```

---

## 8. 负载均衡配置

### 8.1 Nginx 配置

```nginx
# nginx.conf
upstream sushun_backend {
    # 负载均衡算法：least_conn（最少连接）
    least_conn;
    
    # 后端服务器
    server 127.0.0.1:3000 weight=3;
    server 127.0.0.1:3001 weight=2;
    server 127.0.0.1:3002 weight=1;
    
    # 保持连接
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.sushunzb.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.sushunzb.com;
    
    # SSL 证书
    ssl_certificate /etc/ssl/certs/sushunzb.com.crt;
    ssl_certificate_key /etc/ssl/private/sushunzb.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 客户端上传大小
    client_max_body_size 10M;
    
    # 超时配置
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    send_timeout 60s;
    
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
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://sushun_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查端点
    location /api/health {
        proxy_pass http://sushun_backend;
        access_log off;
    }
}
```

---

## 9. 性能优化建议

### 9.1 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 查询优化
-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM products WHERE category = '杀虫剂' AND status = 'active';

-- 定期清理
DELETE FROM messages WHERE status = 'deleted' AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
OPTIMIZE TABLE messages;
```

### 9.2 应用层优化

```javascript
// 优化建议
const optimizationTips = {
  // 1. 使用连接池
  database: '使用数据库连接池，避免频繁创建和销毁连接',
  
  // 2. 实现缓存
  caching: '对频繁访问的数据实现缓存，减少数据库查询',
  
  // 3. 异步处理
  async: '将耗时操作异步化，不阻塞主线程',
  
  // 4. 压缩响应
  compression: '启用 Gzip 压缩，减少传输数据量',
  
  // 5. CDN 加速
  cdn: '使用 CDN 加速静态资源访问',
  
  // 6. 图片优化
  images: '使用 WebP 格式，实现懒加载',
  
  // 7. 代码分割
  codeSplitting: '实现代码分割，按需加载',
  
  // 8. 防抖和节流
  debounce: '对频繁事件使用防抖和节流',
  
  // 9. 数据库查询优化
  queryOptimization: '避免 N+1 查询，使用 JOIN 或批量查询',
  
  // 10. 监控和分析
  monitoring: '持续监控性能指标，及时发现问题'
};

console.log('性能优化建议:', optimizationTips);
```

---

## 总结

本资源限制和性能参数配置提供了：

1. ✅ Node.js 性能配置
2. ✅ 请求限制和速率控制
3. ✅ 数据库连接池配置
4. ✅ Redis 缓存配置
5. ✅ 请求超时配置
6. ✅ 文件上传限制
7. ✅ 性能监控指标
8. ✅ PM2 进程管理
9. ✅ Nginx 负载均衡
10. ✅ 性能优化建议

通过实施本配置，苏顺植保项目将具备良好的性能表现和资源管理能力。
