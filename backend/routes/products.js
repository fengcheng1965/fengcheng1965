const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { category, brand, status, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
    
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR specifications LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY sort_order ASC, id DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const products = await query(sql, params);
    
    const countSql = sql.replace(/SELECT \* FROM/g, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/g, '');
    const countParams = params.slice(0, -2);
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const products = await query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const {
      name,
      category,
      brand,
      price,
      original_price,
      stock,
      unit,
      specifications,
      description,
      usage_instructions,
      precautions,
      image_url,
      gallery_urls,
      status = 'active',
      sort_order = 0
    } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: '产品名称和价格不能为空',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await query(
      `INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order]
    );
    
    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: {
        id: result.insertId,
        ...req.body
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      brand,
      price,
      original_price,
      stock,
      unit,
      specifications,
      description,
      usage_instructions,
      precautions,
      image_url,
      gallery_urls,
      status,
      sort_order
    } = req.body;
    
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    await query(
      `UPDATE products SET name = ?, category = ?, brand = ?, price = ?, original_price = ?, stock = ?, unit = ?, specifications = ?, description = ?, usage_instructions = ?, precautions = ?, image_url = ?, gallery_urls = ?, status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order, id]
    );
    
    res.json({
      success: true,
      message: '产品更新成功'
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    await query('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
