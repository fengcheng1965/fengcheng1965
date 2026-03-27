# 安全认证和加密配置
# 苏顺植保网站 - 安全配置
# 版本: 1.0.0

## 概述

本文档描述了苏顺植保项目的安全认证和加密配置，确保系统符合行业安全标准。

---

## 1. 认证机制

### 1.1 JWT (JSON Web Token) 认证

#### JWT 配置
```javascript
// config/jwt.js
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256',
  issuer: 'sushunzb.com',
  audience: 'sushun-api'
};

function generateToken(payload) {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};
```

#### JWT 中间件
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/jwt');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: '访问令牌无效或已过期',
      code: 'TOKEN_INVALID'
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
```

### 1.2 密码加密

#### Bcrypt 密码哈希
```javascript
// utils/password.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8个字符');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
```

### 1.3 会话管理

#### 会话配置
```javascript
// config/session.js
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const sessionConfig = {
  store: new RedisStore({
    client: redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    }),
    ttl: 86400 // 24小时
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 86400000 // 24小时
  },
  name: 'sushun.sid'
};

module.exports = sessionConfig;
```

---

## 2. 加密机制

### 2.1 数据加密

#### AES 加密工具
```javascript
// utils/encryption.js
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_IV_LENGTH = 16;
const ENCRYPTION_SALT_LENGTH = 64;

function encrypt(text) {
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const salt = crypto.randomBytes(ENCRYPTION_SALT_LENGTH);
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const { encrypted, iv, salt, authTag } = encryptedData;
  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    Buffer.from(salt, 'hex'),
    100000,
    32,
    'sha512'
  );
  
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hashData
};
```

### 2.2 敏感字段加密

#### 数据库字段加密
```javascript
// middleware/encryptFields.js
const { encrypt, decrypt } = require('../utils/encryption');

function encryptFields(fields) {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = encrypt(req.body[field]);
      }
    });
    next();
  };
}

function decryptFields(fields) {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = decrypt(req.body[field]);
      }
    });
    next();
  };
}

module.exports = {
  encryptFields,
  decryptFields
};
```

---

## 3. 安全中间件

### 3.1 Helmet 安全头

```javascript
// middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityConfig = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.sushunzb.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }),

  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path.startsWith('/api/health');
    }
  }),

  cors: (req, callback) => {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
      credentials: true,
      optionsSuccessStatus: 200
    };
    callback(null, corsOptions);
  }
};

module.exports = securityConfig;
```

### 3.2 输入验证

```javascript
// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const validationRules = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('邮箱格式不正确')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('密码长度至少8个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('密码必须包含大小写字母、数字和特殊字符')
  ],

  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('用户名不能为空'),
    
    body('password')
      .trim()
      .notEmpty()
      .withMessage('密码不能为空')
  ],

  createMessage: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('姓名不能为空')
      .isLength({ max: 50 })
      .withMessage('姓名长度不能超过50个字符'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('邮箱格式不正确')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .isMobilePhone('zh-CN')
      .withMessage('手机号格式不正确'),
    
    body('content')
      .trim()
      .notEmpty()
      .withMessage('留言内容不能为空')
      .isLength({ max: 1000 })
      .withMessage('留言内容不能超过1000个字符')
  ]
};

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
}

module.exports = {
  validationRules,
  validate
};
```

---

## 4. 安全最佳实践

### 4.1 密钥管理

#### 密钥轮换策略
```javascript
// scripts/key-rotation.js
const crypto = require('crypto');

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function rotateKeys() {
  const keys = {
    JWT_SECRET: generateSecureKey(32),
    SESSION_SECRET: generateSecureKey(24),
    ENCRYPTION_KEY: generateSecureKey(32),
    API_KEY: generateSecureKey(16),
    API_SECRET: generateSecureKey(32)
  };

  console.log('新生成的密钥:');
  Object.entries(keys).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  return keys;
}

// 执行密钥轮换
if (require.main === module) {
  rotateKeys();
}

module.exports = {
  generateSecureKey,
  rotateKeys
};
```

### 4.2 安全审计日志

```javascript
// middleware/security-audit.js
const securityAuditLog = [];

function logSecurityEvent(event) {
  const auditLog = {
    timestamp: new Date().toISOString(),
    event: event.type,
    userId: event.userId || null,
    ip: event.ip,
    userAgent: event.userAgent,
    details: event.details,
    severity: event.severity || 'info'
  };

  securityAuditLog.push(auditLog);
  
  // 记录到文件
  const fs = require('fs');
  const logPath = process.env.SECURITY_LOG_PATH || './logs/security.log';
  fs.appendFileSync(logPath, JSON.stringify(auditLog) + '\n');
  
  // 高危事件立即告警
  if (auditLog.severity === 'critical') {
    sendAlert(auditLog);
  }
}

function sendAlert(auditLog) {
  // 发送告警通知
  console.error('🚨 安全告警:', auditLog);
  
  // 可以集成邮件、短信、Slack等通知渠道
}

module.exports = {
  logSecurityEvent,
  securityAuditLog
};
```

---

## 5. 安全测试

### 5.1 安全检查脚本

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 执行安全检查..."

# 检查依赖漏洞
echo "📦 检查依赖漏洞..."
npm audit --audit-level=high

# 检查环境变量
echo "🔐 检查环境变量..."
if [ -f .env ]; then
  if git ls-files .env | grep -q .env; then
    echo "❌ 错误: .env 文件被提交到版本控制"
    exit 1
  fi
  echo "✅ .env 文件未被提交"
fi

# 检查敏感信息
echo "🔍 检查代码中的敏感信息..."
if grep -r "password\|secret\|key" --include="*.js" --exclude-dir=node_modules | grep -v "process.env"; then
  echo "⚠️  警告: 发现硬编码的敏感信息"
else
  echo "✅ 未发现硬编码的敏感信息"
fi

# 检查文件权限
echo "📄 检查文件权限..."
if [ -f .env ]; then
  PERMS=$(stat -c %a .env)
  if [ "$PERMS" != "600" ]; then
    echo "⚠️  警告: .env 文件权限不安全 ($PERMS)"
    chmod 600 .env
    echo "✅ 已修复 .env 文件权限为 600"
  else
    echo "✅ .env 文件权限正确 (600)"
  fi
fi

echo "✅ 安全检查完成"
```

### 5.2 渗透测试清单

```markdown
# 安全测试清单

## 认证测试
- [ ] 弱密码测试
- [ ] 暴力破解防护测试
- [ ] 会话固定攻击测试
- [ ] CSRF 攻击测试
- [ ] JWT 令牌过期测试

## 授权测试
- [ ] 水平越权测试
- [ ] 垂直越权测试
- [ ] 未授权访问测试
- [ ] 权限绕过测试

## 输入验证测试
- [ ] SQL 注入测试
- [ ] XSS 攻击测试
- [ ] 命令注入测试
- [ ] 路径遍历测试
- [ ] 文件上传测试

## 数据保护测试
- [ ] 敏感数据加密测试
- [ ] 数据传输加密测试
- [ ] 日志脱敏测试
- [ ] 数据备份测试

## 网络安全测试
- [ ] HTTPS 配置测试
- [ ] TLS 版本测试
- [ ] CORS 配置测试
- [ ] CSP 配置测试
- [ ] 安全头配置测试
```

---

## 6. 合规性检查

### 6.1 数据保护合规

```javascript
// utils/compliance.js
const complianceChecks = {
  GDPR: {
    dataMinimization: true,
    consentManagement: true,
    dataPortability: true,
    rightToErasure: true
  },
  
 网络安全法: {
    dataLocalization: true,
    securityMeasures: true,
    incidentReporting: true,
    userConsent: true
  },
  
 个人信息保护法: {
    purposeLimitation: true,
    dataAccuracy: true,
    storageLimitation: true,
    securityMeasures: true
  }
};

function checkCompliance() {
  console.log('📋 合规性检查结果:');
  
  Object.entries(complianceChecks).forEach(([standard, checks]) => {
    const allPassed = Object.values(checks).every(check => check === true);
    const status = allPassed ? '✅' : '❌';
    console.log(`${status} ${standard}`);
    
    Object.entries(checks).forEach(([check, passed]) => {
      const checkStatus = passed ? '  ✅' : '  ❌';
      console.log(`${checkStatus} ${check}`);
    });
  });
}

module.exports = {
  complianceChecks,
  checkCompliance
};
```

---

## 总结

本安全认证和加密配置提供了：

1. ✅ 完整的 JWT 认证机制
2. ✅ 安全的密码加密和验证
3. ✅ 会话管理配置
4. ✅ 数据加密和解密工具
5. ✅ 安全中间件（Helmet、Rate Limit、CORS）
6. ✅ 输入验证和清理
7. ✅ 密钥管理和轮换策略
8. ✅ 安全审计日志
9. ✅ 安全测试脚本
10. ✅ 合规性检查

通过实施本配置，苏顺植保项目将达到行业安全标准，保护用户数据和系统安全。
