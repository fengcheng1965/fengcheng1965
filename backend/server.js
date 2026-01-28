const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { testConnection } = require('./config/database');
const logger = require('./config/logger');
const requestLogger = require('./middleware/request-logger');
const errorHandler = require('./middleware/error-handler');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const messageRoutes = require('./routes/messages');
const productRoutes = require('./routes/products');
const healthRoutes = require('./routes/health');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors({
 origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
 credentials: true
}));
app.use(compression());
app.use(cookieParser());
app.use(session({
 secret: process.env.SESSION_SECRET || 'sushun-session-secret',
 resave: false,
 saveUninitialized: false,
 cookie: {
   maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
   secure: process.env.SESSION_SECURE === 'true',
   httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
   sameSite: process.env.SESSION_SAME_SITE || 'strict'
 }
}));
app.use(express.json({ limit: process.env.REQUEST_MAX_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
const limiter = rateLimit({
 windowMs: parseInt(process.env.REQUEST_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
 max: parseInt(process.env.REQUEST_RATE_LIMIT_MAX) || 100,
 message: {
 success: false,
 message: '请求过于频繁，请稍后再试',
 code: 'RATE_LIMIT_EXCEEDED',
 retryAfter: Math.ceil((parseInt(process.env.REQUEST_RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
 },
 standardHeaders: true,
 legacyHeaders: false
});
app.use('/api', limiter);
app.get('/', (req, res) => {
 res.json({
 success: true,
 message: '苏顺植保API服务器运行中',
 version: process.env.APP_VERSION || '1.0.0',
 environment: process.env.NODE_ENV || 'development',
 timestamp: new Date().toISOString()
 });
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/products', productRoutes);
app.use((req, res) => {
 res.status(404).json({
 success: false,
 message: '请求的资源不存在',
 code: 'NOT_FOUND',
 path: req.originalUrl
 });
});
app.use(errorHandler);
const startServer = async () => {
 try {
 const dbConnected = await testConnection();
 if (!dbConnected) {
 logger.warn('数据库未连接，部分功能可能无法使用');
 }
 app.listen(PORT, () => {
 logger.info('苏顺植保API服务器已启动', {
 port: PORT,
 environment: process.env.NODE_ENV || 'development',
 url: `http://localhost:${PORT}`
 });
 console.log('\n=================================');
 console.log('🚀 苏顺植保API服务器已启动');
 console.log(`📡 监听端口: ${PORT}`);
 console.log(`🌍 访问地址: http://localhost:${PORT}`);
 console.log(`🏭 环境: ${process.env.NODE_ENV || 'development'}`);
 console.log('=================================\n');
 console.log('📋 API端点:');
 console.log('• GET / - 服务器状态');
 console.log('• GET /api/health - 健康检查');
 console.log('• GET /api/health/ready - 就绪检查');
 console.log('• POST /api/auth/login - 用户登录');
 console.log('• POST /api/auth/register - 用户注册');
 console.log('• GET /api/customers - 获取客户列表');
 console.log('• GET /api/messages - 获取留言列表');
 console.log('• GET /api/products - 获取产品列表');
 console.log('=================================\n');
 });
 }
 catch (error) {
 logger.error('服务器启动失败', { error: error.message, stack: error.stack });
 console.error('❌ 服务器启动失败:', error);
 process.exit(1);
 }
};
startServer();
module.exports = app;
