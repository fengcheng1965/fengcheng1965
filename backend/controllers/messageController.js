const { query } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const getMessages = async (req, res, next) => {
 try {
 const { page = 1, limit = 10, search, status, priority, sortBy = 'created_at', order = 'DESC' } = req.query;
 const offset = (page - 1) * limit;
 let sql = 'SELECT m.*, c.name as customer_name FROM messages m LEFT JOIN customers c ON m.customer_id = c.id WHERE 1=1';
 const params = [];
 if (search) {
 sql += ' AND (m.name LIKE ? OR m.phone LIKE ? OR m.subject LIKE ? OR m.content LIKE ?)';
 params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
 }
 if (status) {
 sql += ' AND m.status = ?';
 params.push(status);
 }
 if (priority) {
 sql += ' AND m.priority = ?';
 params.push(priority);
 }
 sql += ` ORDER BY m.${sortBy} ${order}`;
 const countSql = sql.replace('SELECT m.*, c.name as customer_name', 'SELECT COUNT(*) as total');
 const countResult = await query(countSql, params);
 const total = countResult[0].total;
 sql += ' LIMIT ? OFFSET ?';
 params.push(parseInt(limit), parseInt(offset));
 const messages = await query(sql, params);
 res.json({
 success: true,
 data: {
 messages,
 pagination: {
 page: parseInt(page),
 limit: parseInt(limit),
 total,
 pages: Math.ceil(total / limit)
 }
 }
 });
 }
 catch (error) {
 next(error);
 }
};
const getMessageById = async (req, res, next) => {
 try {
 const { id } = req.params;
 const messages = await query('SELECT m.*, c.name as customer_name FROM messages m LEFT JOIN customers c ON m.customer_id = c.id WHERE m.id = ?', [id]);
 if (messages.length === 0) {
 throw new NotFoundError('留言不存在');
 }
 res.json({
 success: true,
 data: messages[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const createMessage = async (req, res, next) => {
 try {
 const { customerId, name, phone, email, subject, content, priority } = req.body;
 if (!name || !phone || !content) {
 throw new ValidationError('客户姓名、电话和留言内容不能为空');
 }
 const result = await query(`
 INSERT INTO messages (customer_id, name, phone, email, subject, content, priority, status)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
 `, [customerId || null, name, phone, email, subject, content, priority || 'medium', 'pending']);
 const messages = await query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
 res.status(201).json({
 success: true,
 message: '留言创建成功',
 data: messages[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const replyMessage = async (req, res, next) => {
 try {
 const { id } = req.params;
 const { replyContent } = req.body;
 if (!replyContent) {
 throw new ValidationError('回复内容不能为空');
 }
 const messages = await query('SELECT * FROM messages WHERE id = ?', [id]);
 if (messages.length === 0) {
 throw new NotFoundError('留言不存在');
 }
 await query(`
 UPDATE messages SET reply_content = ?, replied_by = ?, replied_at = NOW(), status = ?
 WHERE id = ?
 `, [replyContent, req.user.id, 'replied', id]);
 const updated = await query('SELECT * FROM messages WHERE id = ?', [id]);
 res.json({
 success: true,
 message: '回复成功',
 data: updated[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const updateMessageStatus = async (req, res, next) => {
 try {
 const { id } = req.params;
 const { status, closeReason } = req.body;
 const messages = await query('SELECT * FROM messages WHERE id = ?', [id]);
 if (messages.length === 0) {
 throw new NotFoundError('留言不存在');
 }
 const updateData = { status };
 if (status === 'closed') {
 updateData.closed_by = req.user.id;
 updateData.closed_at = new Date();
 updateData.close_reason = closeReason;
 }
 await query('UPDATE messages SET status = ?, closed_by = ?, closed_at = NOW(), close_reason = ? WHERE id = ?', [status, req.user.id, closeReason, id]);
 const updated = await query('SELECT * FROM messages WHERE id = ?', [id]);
 res.json({
 success: true,
 message: '状态更新成功',
 data: updated[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const deleteMessage = async (req, res, next) => {
 try {
 const { id } = req.params;
 const messages = await query('SELECT * FROM messages WHERE id = ?', [id]);
 if (messages.length === 0) {
 throw new NotFoundError('留言不存在');
 }
 if (req.user.role !== 'admin' && req.user.role !== 'manager') {
 throw new ForbiddenError('无权删除留言');
 }
 await query('DELETE FROM messages WHERE id = ?', [id]);
 res.json({
 success: true,
 message: '留言删除成功'
 });
 }
 catch (error) {
 next(error);
 }
};
const getMessageStats = async (req, res, next) => {
 try {
 const stats = await query(`
 SELECT 
 status,
 COUNT(*) as count
 FROM messages
 GROUP BY status
 `);
 const priorityStats = await query(`
 SELECT 
 priority,
 COUNT(*) as count
 FROM messages
 GROUP BY priority
 `);
 const today = new Date().toISOString().split('T')[0];
 const todayCount = await query(`
 SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = ?
 `, [today]);
 res.json({
 success: true,
 data: {
 status: stats,
 priority: priorityStats,
 today: todayCount[0].count
 }
 });
 }
 catch (error) {
 next(error);
 }
};
module.exports = {
 getMessages,
 getMessageById,
 createMessage,
 replyMessage,
 updateMessageStatus,
 deleteMessage,
 getMessageStats
};
