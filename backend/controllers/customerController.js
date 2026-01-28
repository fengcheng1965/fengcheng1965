const { query } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const getCustomers = async (req, res, next) => {
 try {
 const { page = 1, limit = 10, search, status, sortBy = 'created_at', order = 'DESC' } = req.query;
 const offset = (page - 1) * limit;
 let sql = 'SELECT * FROM customers WHERE 1=1';
 const params = [];
 if (search) {
 sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)';
 params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
 }
 if (status) {
 sql += ' AND status = ?';
 params.push(status);
 }
 if (req.user.role === 'sales') {
 sql += ' AND sales_person_id = ?';
 params.push(req.user.id);
 }
 sql += ` ORDER BY ${sortBy} ${order}`;
 const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
 const countResult = await query(countSql, params);
 const total = countResult[0].total;
 sql += ' LIMIT ? OFFSET ?';
 params.push(parseInt(limit), parseInt(offset));
 const customers = await query(sql, params);
 res.json({
 success: true,
 data: {
 customers,
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
const getCustomerById = async (req, res, next) => {
 try {
 const { id } = req.params;
 const customers = await query('SELECT * FROM customers WHERE id = ?', [id]);
 if (customers.length === 0) {
 throw new NotFoundError('客户不存在');
 }
 if (req.user.role === 'sales' && customers[0].sales_person_id !== req.user.id) {
 throw new ForbiddenError('无权访问此客户信息');
 }
 res.json({
 success: true,
 data: customers[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const createCustomer = async (req, res, next) => {
 try {
 const { name, phone, email, company, address, customerSource, status, salesPersonId, notes } = req.body;
 if (!name || !phone) {
 throw new ValidationError('客户姓名和电话不能为空');
 }
 const existing = await query('SELECT id FROM customers WHERE phone = ?', [phone]);
 if (existing.length > 0) {
 throw new ValidationError('该电话号码已存在');
 }
 const result = await query(`
 INSERT INTO customers (name, phone, email, company, address, customer_source, status, sales_person_id, notes)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
 `, [name, phone, email, company, address, customerSource, status || 'potential', salesPersonId, notes]);
 const customers = await query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
 res.status(201).json({
 success: true,
 message: '客户创建成功',
 data: customers[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const updateCustomer = async (req, res, next) => {
 try {
 const { id } = req.params;
 const { name, phone, email, company, address, customerSource, status, salesPersonId, notes } = req.body;
 const customers = await query('SELECT * FROM customers WHERE id = ?', [id]);
 if (customers.length === 0) {
 throw new NotFoundError('客户不存在');
 }
 if (req.user.role === 'sales' && customers[0].sales_person_id !== req.user.id) {
 throw new ForbiddenError('无权修改此客户信息');
 }
 await query(`
 UPDATE customers SET name = ?, phone = ?, email = ?, company = ?, address = ?, customer_source = ?, status = ?, sales_person_id = ?, notes = ?
 WHERE id = ?
 `, [name, phone, email, company, address, customerSource, status, salesPersonId, notes, id]);
 const updated = await query('SELECT * FROM customers WHERE id = ?', [id]);
 res.json({
 success: true,
 message: '客户信息更新成功',
 data: updated[0]
 });
 }
 catch (error) {
 next(error);
 }
};
const deleteCustomer = async (req, res, next) => {
 try {
 const { id } = req.params;
 const customers = await query('SELECT * FROM customers WHERE id = ?', [id]);
 if (customers.length === 0) {
 throw new NotFoundError('客户不存在');
 }
 if (req.user.role !== 'admin' && req.user.role !== 'manager') {
 throw new ForbiddenError('无权删除客户');
 }
 await query('DELETE FROM customers WHERE id = ?', [id]);
 res.json({
 success: true,
 message: '客户删除成功'
 });
 }
 catch (error) {
 next(error);
 }
};
module.exports = {
 getCustomers,
 getCustomerById,
 createCustomer,
 updateCustomer,
 deleteCustomer
};
