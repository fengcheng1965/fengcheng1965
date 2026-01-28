# 环境变量管理方案
# 苏顺植保网站 - 环境变量管理
# 版本: 1.0.0

## 概述

本文档描述了苏顺植保项目的环境变量管理方案，确保敏感信息安全存储和管理。

---

## 环境变量分类

### 1. 公开环境变量 (可提交到版本控制)
- `NODE_ENV`
- `PORT`
- `HOST`
- `LOG_LEVEL`
- `LOG_FORMAT`
- `APP_VERSION`

### 2. 敏感环境变量 (不可提交到版本控制)
- 数据库密码
- JWT密钥
- API密钥
- 第三方服务凭证
- SSL证书路径
- 加密密钥

---

## 环境变量管理策略

### 开发环境
```bash
# 使用 .env.development 文件
cp .env.development .env
# .env 文件已在 .gitignore 中
```

### 生产环境
```bash
# 使用 .env.production 文件
cp .env.production .env
# 手动替换敏感信息
```

### CI/CD环境
```bash
# 使用 CI/CD 平台的环境变量管理
# GitHub Actions: Settings > Secrets
# GitLab CI: Settings > CI/CD > Variables
```

---

## 敏感信息加密方案

### 1. 使用环境变量加密工具

#### 安装加密工具
```bash
npm install --save-dev dotenv-cli crypto-js
```

#### 加密脚本
```javascript
// scripts/encrypt-env.js
const CryptoJS = require('crypto-js');
const fs = require('fs');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me';

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// 读取 .env 文件
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');

// 加密敏感变量
const encryptedLines = lines.map(line => {
  if (line.includes('PASSWORD') || 
      line.includes('SECRET') || 
      line.includes('KEY') ||
      line.includes('TOKEN')) {
    const [key, value] = line.split('=');
    return `${key}=encrypted:${encrypt(value)}`;
  }
  return line;
});

// 写入加密后的文件
fs.writeFileSync('.env.encrypted', encryptedLines.join('\n'));
console.log('环境变量已加密到 .env.encrypted');
```

### 2. 解密脚本
```javascript
// scripts/decrypt-env.js
const CryptoJS = require('crypto-js');
const fs = require('fs');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me';

function decrypt(encryptedText) {
  if (!encryptedText.startsWith('encrypted:')) {
    return encryptedText;
  }
  const ciphertext = encryptedText.replace('encrypted:', '');
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// 读取加密文件
const encryptedContent = fs.readFileSync('.env.encrypted', 'utf8');
const lines = encryptedContent.split('\n');

// 解密变量
const decryptedLines = lines.map(line => {
  if (line.includes('encrypted:')) {
    const [key, value] = line.split('=');
    return `${key}=${decrypt(value)}`;
  }
  return line;
});

// 写入解密后的文件
fs.writeFileSync('.env', decryptedLines.join('\n'));
console.log('环境变量已解密到 .env');
```

---

## 配置版本控制机制

### 1. 配置文件版本管理

#### 版本化配置文件
```
backend/
├── config/
│   ├── versions/
│   │   ├── v1.0.0.env.production
│   │   ├── v1.0.1.env.production
│   │   └── v1.1.0.env.production
│   ├── .env.development
│   ├── .env.production
│   └── .env.example
```

### 2. 配置变更记录

#### 配置变更日志
```javascript
// config/CHANGELOG.md
# 配置变更日志

## [1.1.0] - 2026-01-29
### 新增
- 添加 Redis 缓存配置
- 添加 CDN 配置
- 添加 Sentry 监控配置

### 修改
- 更新 JWT 过期时间为 7 天
- 调整数据库连接池大小

### 删除
- 移除旧的邮件服务配置

## [1.0.0] - 2026-01-28
### 初始版本
- 基础生产环境配置
```

---

## 环境变量验证

### 1. 必需环境变量检查

```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'NODE_ENV',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'API_BASE_URL',
  'FRONTEND_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('缺少必需的环境变量:');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

console.log('✅ 所有必需的环境变量都已设置');
```

### 2. 环境变量类型验证

```javascript
// scripts/validate-env-types.js
const envVarTypes = {
  'PORT': 'number',
  'DB_PORT': 'number',
  'LOG_LEVEL': ['error', 'warn', 'info', 'debug'],
  'NODE_ENV': ['development', 'production', 'test']
};

function validateEnvVar(name, type) {
  const value = process.env[name];
  
  if (!value) {
    console.warn(`⚠️  环境变量 ${name} 未设置`);
    return false;
  }
  
  if (Array.isArray(type)) {
    if (!type.includes(value)) {
      console.error(`❌ 环境变量 ${name} 的值必须是 ${type.join(', ')} 之一`);
      return false;
    }
  } else if (type === 'number') {
    if (isNaN(Number(value))) {
      console.error(`❌ 环境变量 ${name} 必须是数字`);
      return false;
    }
  }
  
  return true;
}

Object.entries(envVarTypes).forEach(([name, type]) => {
  validateEnvVar(name, type);
});
```

---

## 部署时环境变量管理

### 1. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${NODE_ENV}
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 2. Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sushun-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: sushun-secrets
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  API_KEY: <base64-encoded-key>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sushun-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sushun
  template:
    metadata:
      labels:
        app: sushun
    spec:
      containers:
      - name: sushun
        image: sushun/app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: sushun-config
        - secretRef:
            name: sushun-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 安全最佳实践

### 1. 环境变量安全规则

- ✅ 永远不要将 `.env` 文件提交到版本控制
- ✅ 使用强密码和随机密钥
- ✅ 定期轮换密钥和密码
- ✅ 使用不同的密钥用于不同环境
- ✅ 限制环境变量的访问权限
- ✅ 使用加密存储敏感信息
- ✅ 定期审计环境变量访问日志

### 2. 密钥生成

```bash
# 生成 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 API 密钥
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 生成会话密钥
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 3. 权限管理

```bash
# 设置环境变量文件权限
chmod 600 .env
chmod 600 .env.production

# 确保只有所有者可以读取
ls -la .env*
```

---

## 监控和审计

### 1. 环境变量访问监控

```javascript
// middleware/env-access-logger.js
const envAccessLog = new Map();

function logEnvAccess(varName) {
  const timestamp = new Date().toISOString();
  const stack = new Error().stack;
  
  if (!envAccessLog.has(varName)) {
    envAccessLog.set(varName, []);
  }
  
  envAccessLog.get(varName).push({
    timestamp,
    stack: stack.split('\n').slice(1, 3).join('\n')
  });
  
  // 记录到日志
  console.warn(`[ENV_ACCESS] ${varName} accessed at ${timestamp}`);
}

// 覆盖 process.env 访问
const originalEnv = process.env;
process.env = new Proxy(originalEnv, {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    if (prop !== 'NODE_ENV' && prop !== 'PORT') {
      logEnvAccess(prop);
    }
    return value;
  }
});
```

### 2. 配置变更审计

```javascript
// scripts/audit-config.js
const fs = require('fs');
const crypto = require('crypto');

function calculateFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function monitorConfigChanges(filePath) {
  const currentHash = calculateFileHash(filePath);
  const hashFile = `${filePath}.hash`;
  
  let previousHash = '';
  if (fs.existsSync(hashFile)) {
    previousHash = fs.readFileSync(hashFile, 'utf8');
  }
  
  if (previousHash !== currentHash) {
    console.log(`⚠️  配置文件已变更: ${filePath}`);
    console.log(`  之前: ${previousHash}`);
    console.log(`  现在: ${currentHash}`);
    console.log(`  时间: ${new Date().toISOString()}`);
    
    fs.writeFileSync(hashFile, currentHash);
  }
}

// 监控配置文件
monitorConfigChanges('.env');
monitorConfigChanges('.env.production');
```

---

## 故障排除

### 常见问题

#### 1. 环境变量未生效
```bash
# 检查环境变量是否正确加载
node -e "console.log(process.env.NODE_ENV)"

# 重启应用
pm2 restart sushun-app
```

#### 2. 敏感信息泄露
```bash
# 检查 .gitignore 是否包含 .env
cat .gitignore | grep .env

# 检查是否有敏感信息被提交
git log --all --full-history --source -- "*env*"
```

#### 3. 配置冲突
```bash
# 检查环境变量优先级
node -e "console.log(process.env)" | grep DB_HOST

# 清除缓存
pm2 flush
```

---

## 总结

本环境变量管理方案提供了：

1. ✅ 完整的环境变量分类和管理策略
2. ✅ 敏感信息加密和解密机制
3. ✅ 配置版本控制和变更追踪
4. ✅ 环境变量验证和类型检查
5. ✅ 多种部署方式的支持
6. ✅ 安全最佳实践和监控
7. ✅ 故障排除指南

通过遵循本方案，可以确保苏顺植保项目的环境变量安全、可靠、可维护。
