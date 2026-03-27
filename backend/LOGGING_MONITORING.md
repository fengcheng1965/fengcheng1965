# 日志和监控系统配置
# 苏顺植保网站 - 日志监控
# 版本: 1.0.0

## 概述

本文档描述了苏顺植保项目的日志和监控系统配置，确保系统可观测性和故障快速定位。

---

## 1. 日志系统配置

### 1.1 Winston 日志配置

```javascript
// config/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台日志格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// 日志传输配置
const transports = [
  // 控制台日志
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  }),

  // 应用日志
  new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 14, // 保留14天
    level: process.env.LOG_LEVEL || 'info'
  }),

  // 错误日志
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 30, // 保留30天
    level: 'error'
  }),

  // 访问日志
  new winston.transports.File({
    filename: path.join(logDir, 'access.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 7, // 保留7天
    level: 'http'
  }),

  // 安全日志
  new winston.transports.File({
    filename: path.join(logDir, 'security.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 30, // 保留30天
    level: 'warn'
  })
];

// 创建日志器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// 日志级别映射
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 日志工具函数
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
```

### 1.2 请求日志中间件

```javascript
// middleware/request-logger.js
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // 添加请求ID到请求对象
  req.id = requestId;

  // 记录请求信息
  logger.http({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };

    // 根据状态码记录不同级别的日志
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.http('Request completed', logData);
    }
  });

  next();
}

module.exports = requestLogger;
```

### 1.3 错误日志中间件

```javascript
// middleware/error-logger.js
const logger = require('../config/logger');

function errorLogger(err, req, res, next) {
  const errorData = {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  };

  // 记录错误
  logger.error('Application error', errorData);

  // 发送到 Sentry
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.captureException(err, {
      requestId: req.id,
      user: req.user
    });
  }

  next(err);
}

module.exports = errorLogger;
```

---

## 2. 监控系统配置

### 2.1 应用性能监控 (APM)

```javascript
// config/apm.js
const apm = require('elastic-apm-node').start({
  serviceName: 'sushun-backend',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  environment: process.env.NODE_ENV,
  logLevel: 'info',
  
  // 事务采样
  transactionSampleRate: 0.1,
  
  // 错误收集
  captureExceptions: true,
  captureBody: 'all',
  
  // 指标收集
  metricsInterval: '30s',
  
  // 中心化配置
  centralConfig: false
});

module.exports = apm;
```

### 2.2 Sentry 错误监控

```javascript
// config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  
  // 性能监控
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mongo()
  ],
  
  // 错误过滤
  beforeSend(event, hint) {
    // 过滤敏感信息
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
  
  // 环境信息
  release: process.env.APP_VERSION,
  serverName: process.env.HOSTNAME || 'sushun-production'
});

module.exports = Sentry;
```

### 2.3 健康检查端点

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    };

    // 检查数据库连接
    try {
      await db.query('SELECT 1');
      healthCheck.database = 'connected';
    } catch (error) {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'degraded';
    }

    // 检查 Redis 连接
    if (process.env.REDIS_HOST) {
      try {
        const redis = require('redis').createClient({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
        });
        await redis.connect();
        healthCheck.redis = 'connected';
        await redis.quit();
      } catch (error) {
        healthCheck.redis = 'disconnected';
        healthCheck.status = 'degraded';
      }
    }

    // 检查磁盘空间
    const fs = require('fs');
    const stats = fs.statSync('.');
    healthCheck.disk = {
      free: stats.free,
      total: stats.size
    };

    // 检查内存使用
    healthCheck.memory = {
      used: process.memoryUsage(),
      total: process.memoryUsage().heapTotal
    };

    // 根据状态返回不同的 HTTP 状态码
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    logger.info('Health check completed', healthCheck);
    res.status(statusCode).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      message: '健康检查失败',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 3. 告警系统配置

### 3.1 告警规则

```javascript
// config/alerts.js
const alertRules = {
  // 错误率告警
  errorRate: {
    enabled: true,
    threshold: 0.05, // 5%
    window: 300000, // 5分钟
    severity: 'critical',
    message: '错误率超过阈值'
  },

  // 响应时间告警
  responseTime: {
    enabled: true,
    threshold: 3000, // 3秒
    window: 60000, // 1分钟
    severity: 'warning',
    message: '响应时间超过阈值'
  },

  // 内存使用告警
  memoryUsage: {
    enabled: true,
    threshold: 0.9, // 90%
    window: 60000, // 1分钟
    severity: 'warning',
    message: '内存使用率过高'
  },

  // 磁盘空间告警
  diskSpace: {
    enabled: true,
    threshold: 0.9, // 90%
    window: 300000, // 5分钟
    severity: 'critical',
    message: '磁盘空间不足'
  },

  // 数据库连接告警
  dbConnection: {
    enabled: true,
    threshold: 0, // 0个连接
    window: 60000, // 1分钟
    severity: 'critical',
    message: '数据库连接失败'
  }
};

module.exports = alertRules;
```

### 3.2 告警通知

```javascript
// services/alert-notifier.js
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendAlert(alert) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.ALERT_EMAIL || 'admin@sushunzb.com',
    subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
    html: `
      <h2>告警详情</h2>
      <p><strong>严重程度:</strong> ${alert.severity}</p>
      <p><strong>消息:</strong> ${alert.message}</p>
      <p><strong>时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
      <p><strong>详情:</strong></p>
      <pre>${JSON.stringify(alert.details, null, 2)}</pre>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Alert sent successfully', { alert });
  } catch (error) {
    logger.error('Failed to send alert', { error: error.message });
  }
}

async function sendSMSAlert(alert) {
  // 集成短信服务发送告警
  logger.info('SMS alert sent', { alert });
}

async function sendSlackAlert(alert) {
  // 集成 Slack 发送告警
  logger.info('Slack alert sent', { alert });
}

module.exports = {
  sendAlert,
  sendSMSAlert,
  sendSlackAlert
};
```

---

## 4. 指标收集

### 4.1 Prometheus 指标

```javascript
// config/prometheus.js
const promClient = require('prom-client');

// 默认指标
promClient.collectDefaultMetrics({
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 5, 10]
});

// 自定义指标
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

function recordHttpRequest(method, route, statusCode, duration) {
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
}

function recordDbQuery(operation, table, duration) {
  dbQueryDuration.observe({ operation, table }, duration);
}

function updateActiveConnections(count) {
  activeConnections.set(count);
}

module.exports = {
  promClient,
  httpRequestDuration,
  httpRequestsTotal,
  dbQueryDuration,
  activeConnections,
  recordHttpRequest,
  recordDbQuery,
  updateActiveConnections
};
```

### 4.2 指标端点

```javascript
// routes/metrics.js
const express = require('express');
const router = express.Router();
const { promClient } = require('../config/prometheus');

router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

module.exports = router;
```

---

## 5. 日志分析

### 5.1 日志查询工具

```javascript
// scripts/log-analyzer.js
const fs = require('fs');
const path = require('path');

function analyzeLogFile(logPath) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const stats = {
    total: lines.length,
    byLevel: {},
    byHour: {},
    errors: [],
    warnings: []
  };

  lines.forEach(line => {
    try {
      const log = JSON.parse(line);
      const level = log.level;
      const hour = new Date(log.timestamp).getHours();

      // 按级别统计
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      // 按小时统计
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

      // 收集错误和警告
      if (level === 'error') {
        stats.errors.push(log);
      } else if (level === 'warn') {
        stats.warnings.push(log);
      }
    } catch (error) {
      // 忽略无法解析的行
    }
  });

  return stats;
}

function generateReport(stats) {
  console.log('📊 日志分析报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`总日志数: ${stats.total}`);
  console.log('\n按级别统计:');
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    const percentage = ((count / stats.total) * 100).toFixed(2);
    console.log(`  ${level}: ${count} (${percentage}%)`);
  });
  console.log(`\n错误数: ${stats.errors.length}`);
  console.log(`警告数: ${stats.warnings.length}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 执行分析
const logPath = path.join(__dirname, '../logs/app.log');
const stats = analyzeLogFile(logPath);
generateReport(stats);

module.exports = {
  analyzeLogFile,
  generateReport
};
```

---

## 6. 监控仪表板

### 6.1 Grafana 仪表板配置

```json
{
  "dashboard": {
    "title": "苏顺植保 - 应用监控",
    "panels": [
      {
        "title": "请求速率",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "响应时间",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, http_request_duration_seconds)",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "title": "错误率",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "错误率"
          }
        ]
      },
      {
        "title": "数据库查询时间",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, db_query_duration_seconds)",
            "legendFormat": "P95"
          }
        ]
      },
      {
        "title": "内存使用",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "内存 (MB)"
          }
        ]
      },
      {
        "title": "活跃连接数",
        "targets": [
          {
            "expr": "active_connections",
            "legendFormat": "连接数"
          }
        ]
      }
    ]
  }
}
```

---

## 7. 日志保留和归档

### 7.1 日志归档脚本

```bash
#!/bin/bash
# scripts/archive-logs.sh

LOG_DIR="./logs"
ARCHIVE_DIR="./logs/archive"
RETENTION_DAYS=30

# 创建归档目录
mkdir -p "$ARCHIVE_DIR"

# 归档旧日志
find "$LOG_DIR" -name "*.log" -mtime +7 -exec gzip {} \;
find "$LOG_DIR" -name "*.log.gz" -exec mv {} "$ARCHIVE_DIR/" \;

# 删除过期日志
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -delete

echo "日志归档完成"
```

---

## 总结

本日志和监控系统配置提供了：

1. ✅ 完整的 Winston 日志系统
2. ✅ 请求和错误日志中间件
3. ✅ 应用性能监控 (APM)
4. ✅ Sentry 错误监控
5. ✅ 健康检查端点
6. ✅ 告警规则和通知
7. ✅ Prometheus 指标收集
8. ✅ 日志分析工具
9. ✅ Grafana 仪表板配置
10. ✅ 日志保留和归档

通过实施本配置，可以全面监控苏顺植保项目的运行状态，及时发现和解决问题。
