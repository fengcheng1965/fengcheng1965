const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const login = async (req, res, next) => {
 try {
 const { username, password } = req.body;
 if (!username || !password) {
 throw new ValidationError('用户名和密码不能为空');
 }
 const users = await query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
 if (users.length === 0) {
 throw new UnauthorizedError('用户名或密码错误');
 }
 const user = users[0];
 if (user.status === 'locked') {
 throw new UnauthorizedError('账号已被锁定，请联系管理员');
 }
 const isValidPassword = await bcrypt.compare(password, user.password);
 if (!isValidPassword) {
 await query('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [user.id]);
 if (user.failed_login_attempts >= 2) {
 await query('UPDATE users SET status = ? WHERE id = ?', ['locked', user.id]);
 }
 throw new UnauthorizedError('用户名或密码错误');
 }
 await query('UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE id = ?', [user.id]);
 const token = jwt.sign({
 userId: user.id,
 username: user.username,
 role: user.role
 }, process.env.JWT_SECRET, {
 expiresIn: process.env.JWT_EXPIRES_IN || '7d'
 });
 const refreshToken = jwt.sign({
 userId: user.id
 }, process.env.JWT_REFRESH_SECRET, {
 expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
 });
 res.json({
 success: true,
 message: '登录成功',
 data: {
 token,
 refreshToken,
 user: {
 id: user.id,
 username: user.username,
 email: user.email,
 fullName: user.full_name,
 phone: user.phone,
 role: user.role,
 status: user.status
 }
 }
 });
 }
 catch (error) {
 next(error);
 }
};
const register = async (req, res, next) => {
 try {
 const { username, password, email, fullName, phone, role } = req.body;
 if (!username || !password || !email) {
 throw new ValidationError('用户名、密码和邮箱不能为空');
 }
 const existingUsers = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
 if (existingUsers.length > 0) {
 throw new ValidationError('用户名或邮箱已存在');
 }
 const hashedPassword = await bcrypt.hash(password, 10);
 const result = await query(`
 INSERT INTO users (username, password, email, full_name, phone, role, status)
 VALUES (?, ?, ?, ?, ?, ?, ?)
 `, [username, hashedPassword, email, fullName, phone, role || 'staff', 'active']);
 res.status(201).json({
 success: true,
 message: '注册成功',
 data: {
 userId: result.insertId,
 username,
 email,
 role: role || 'staff'
 }
 });
 }
 catch (error) {
 next(error);
 }
};
const refreshToken = async (req, res, next) => {
 try {
 const { refreshToken } = req.body;
 if (!refreshToken) {
 throw new ValidationError('刷新令牌缺失');
 }
 const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
 const users = await query('SELECT id, username, email, role, status FROM users WHERE id = ?', [decoded.userId]);
 if (users.length === 0) {
 throw new UnauthorizedError('用户不存在');
 }
 const user = users[0];
 const token = jwt.sign({
 userId: user.id,
 username: user.username,
 role: user.role
 }, process.env.JWT_SECRET, {
 expiresIn: process.env.JWT_EXPIRES_IN || '7d'
 });
 res.json({
 success: true,
 message: '令牌刷新成功',
 data: {
 token
 }
 });
 }
 catch (error) {
 next(error);
 }
};
const logout = async (req, res, next) => {
 try {
 res.json({
 success: true,
 message: '退出登录成功'
 });
 }
 catch (error) {
 next(error);
 }
};
const getProfile = async (req, res, next) => {
 try {
 const users = await query('SELECT id, username, email, full_name, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
 if (users.length === 0) {
 throw new UnauthorizedError('用户不存在');
 }
 res.json({
 success: true,
 data: users[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const updateProfile = async (req, res, next) => {
 try {
 const { email, fullName, phone } = req.body;
 await query('UPDATE users SET email = ?, full_name = ?, phone = ? WHERE id = ?', [email, fullName, phone, req.user.id]);
 const users = await query('SELECT id, username, email, full_name, phone, role, status FROM users WHERE id = ?', [req.user.id]);
 res.json({
 success: true,
 message: '个人信息更新成功',
 data: users[0]
 });
 }
 catch (error) {
 next(error);
 }
};
module.exports = {
 login,
 register,
 refreshToken,
 logout,
 getProfile,
 updateProfile
};
