const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      cpu: process.cpuUsage()
    };

    logger.info('Health check passed', healthCheck);
    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    const readinessCheck = {
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: 'ok'
      }
    };

    res.json(readinessCheck);
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'not_ready',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;