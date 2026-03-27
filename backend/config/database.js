const mysql = require('mysql2/promise');
const logger = require('./logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sushun_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 100,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('数据库连接成功', {
      host: dbConfig.host,
      database: dbConfig.database
    });
    connection.release();
    return true;
  } catch (error) {
    logger.error('数据库连接失败', {
      error: error.message,
      host: dbConfig.host,
      database: dbConfig.database
    });
    return false;
  }
};

const query = async (sql, params) => {
  try {
    const [results] = await pool.query(sql, params);
    logger.debug('数据库查询成功', { sql, params });
    return results;
  } catch (error) {
    logger.error('数据库查询错误', { error: error.message, sql, params });
    throw error;
  }
};

const execute = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    logger.debug('数据库执行成功', { sql, params });
    return results;
  } catch (error) {
    logger.error('数据库执行错误', { error: error.message, sql, params });
    throw error;
  }
};

module.exports = {
  pool,
  dbConfig,
  testConnection,
  query,
  execute
};
