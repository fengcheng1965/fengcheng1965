const errorHandler = (err, req, res, next) => {
 console.error('错误:', err);
 let statusCode = err.statusCode || 500;
 let message = err.message || '服务器内部错误';
 let code = err.code || 'INTERNAL_ERROR';
 if (err.name === 'ValidationError') {
 statusCode = 400;
 message = '数据验证失败';
 code = 'VALIDATION_ERROR';
 }
 if (err.name === 'UnauthorizedError') {
 statusCode = 401;
 message = '未授权访问';
 code = 'UNAUTHORIZED';
 }
 if (err.name === 'ForbiddenError') {
 statusCode = 403;
 message = '禁止访问';
 code = 'FORBIDDEN';
 }
 if (err.name === 'NotFoundError') {
 statusCode = 404;
 message = '资源不存在';
 code = 'NOT_FOUND';
 }
 if (err.code === 'ER_DUP_ENTRY') {
 statusCode = 400;
 message = '数据已存在';
 code = 'DUPLICATE_ENTRY';
 }
 if (err.code === 'ER_NO_REFERENCED_ROW_2') {
 statusCode = 400;
 message = '引用的资源不存在';
 code = 'REFERENCE_NOT_FOUND';
 }
 const errorResponse = {
 success: false,
 message,
 code,
 ...(process.env.NODE_ENV === 'development' && {
 stack: err.stack
 })
 };
 res.status(statusCode).json(errorResponse);
};
const notFound = (req, res) => {
 res.status(404).json({
 success: false,
 message: '请求的资源不存在',
 code: 'NOT_FOUND'
 });
};
class AppError extends Error {
 constructor(message, statusCode, code) {
 super(message);
 this.statusCode = statusCode;
 this.code = code;
 this.name = 'AppError';
 Error.captureStackTrace(this, this.constructor);
 }
}
class ValidationError extends AppError {
 constructor(message, code = 'VALIDATION_ERROR') {
 super(message || '数据验证失败', 400, code);
 this.name = 'ValidationError';
 }
}
class UnauthorizedError extends AppError {
 constructor(message, code = 'UNAUTHORIZED') {
 super(message || '未授权访问', 401, code);
 this.name = 'UnauthorizedError';
 }
}
class ForbiddenError extends AppError {
 constructor(message, code = 'FORBIDDEN') {
 super(message || '禁止访问', 403, code);
 this.name = 'ForbiddenError';
 }
}
class NotFoundError extends AppError {
 constructor(message, code = 'NOT_FOUND') {
 super(message || '资源不存在', 404, code);
 this.name = 'NotFoundError';
 }
}
module.exports = {
 errorHandler,
 notFound,
 AppError,
 ValidationError,
 UnauthorizedError,
 ForbiddenError,
 NotFoundError
};
