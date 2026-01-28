const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const authenticateToken = async (req, res, next) => {
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
 const decoded = jwt.verify(token, process.env.JWT_SECRET);
 const user = await query('SELECT id, username, email, role, status FROM users WHERE id = ?', [decoded.userId]);
 if (!user || user.length === 0) {
 return res.status(401).json({
 success: false,
 message: '用户不存在',
 code: 'USER_NOT_FOUND'
 });
 }
 if (user[0].status === 'locked') {
 return res.status(403).json({
 success: false,
 message: '账号已被锁定',
 code: 'USER_LOCKED'
 });
 }
 req.user = user[0];
 next();
 }
 catch (error) {
 if (error.name === 'TokenExpiredError') {
 return res.status(401).json({
 success: false,
 message: '访问令牌已过期',
 code: 'TOKEN_EXPIRED'
 });
 }
 return res.status(403).json({
 success: false,
 message: '无效的访问令牌',
 code: 'INVALID_TOKEN'
 });
 }
};
const requireRole = (roles) => {
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
};
const requireAdmin = requireRole(['admin']);
const requireManager = requireRole(['admin', 'manager']);
const requireStaff = requireRole(['admin', 'manager', 'staff']);
module.exports = {
 authenticateToken,
 requireRole,
 requireAdmin,
 requireManager,
 requireStaff
};
