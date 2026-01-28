const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const seedData = async () => {
  try {
    console.log('🚀 开始插入初始数据...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await query(`
      INSERT INTO users (username, password, email, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `, ['admin', hashedPassword, 'admin@sushunzhibao.com', '系统管理员', '400-888-8888', 'admin', 'active']);
    console.log('✅ 管理员用户创建成功');

    await query(`
      INSERT INTO users (username, password, email, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `, ['manager', hashedPassword, 'manager@sushunzhibao.com', '经理', '400-888-8889', 'manager', 'active']);
    console.log('✅ 经理用户创建成功');

    await query(`
      INSERT INTO users (username, password, email, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `, ['staff', hashedPassword, 'staff@sushunzhibao.com', '客服人员', '400-888-8890', 'staff', 'active']);
    console.log('✅ 客服用户创建成功');

    const customers = [
      ['张三', '13800138000', 'zhangsan@example.com', '张三农业有限公司', '北京市朝阳区建国路123号', '网站', 'active', 1, 'VIP客户，订单量大'],
      ['李四', '13900139000', 'lisi@example.com', '李四农场', '上海市浦东新区世纪大道456号', '电话', 'potential', 2, '潜在客户，有意向合作'],
      ['王五', '13700137000', 'wangwu@example.com', '王五种植基地', '广州市天河区珠江新城789号', '转介绍', 'active', 1, '老客户，信誉良好'],
      ['赵六', '13600136000', 'zhaoliu@example.com', '赵六合作社', '深圳市南山区科技园321号', '网站', 'potential', null, '新客户，需要跟进'],
      ['孙七', '13500135000', 'sunqi@example.com', '孙七农业科技', '杭州市西湖区文一路654号', '电话', 'active', 2, '长期合作伙伴']
    ];
    for (const customer of customers) {
      await query(`
        INSERT INTO customers (name, phone, email, company, address, customer_source, status, sales_person_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, customer);
    }
    console.log('✅ 客户数据插入成功');

    await query(`
      INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
      VALUES ('高效杀虫剂 - 25%吡虫啉乳油', '杀虫剂', '品牌A', 88.00, 108.00, 1000, '瓶', '25%吡虫啉乳油，100ml/瓶', '针对多种害虫，效果显著，持效期长，使用安全', '1. 摇匀后稀释使用；2. 避免高温时段喷施；3. 遵守安全间隔期', 'https://via.placeholder.com/500x500/43A047/ffffff?text=高效杀虫剂', '["https://via.placeholder.com/500x500/43A047/ffffff?text=图1","https://via.placeholder.com/500x500/43A047/ffffff?text=图2"]', 'active', 1)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 产品1插入成功');

    await query(`
      INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
      VALUES ('杀菌剂 - 70%甲基硫菌灵可湿性粉剂', '杀菌剂', '品牌A', 128.00, 158.00, 800, '袋', '70%甲基硫菌灵可湿性粉剂，100g/袋', '有效防治真菌病害，保护作物健康，适用范围广', '1. 按比例稀释；2. 发病初期开始使用；3. 连续使用2-3次', 'https://via.placeholder.com/500x500/1976D2/ffffff?text=杀菌剂', '["https://via.placeholder.com/500x500/1976D2/ffffff?text=图1","https://via.placeholder.com/500x500/1976D2/ffffff?text=图2"]', 'active', 2)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 产品2插入成功');

    await query(`
      INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
      VALUES ('除草剂 - 41%草甘膦异丙胺盐水剂', '除草剂', '品牌B', 68.00, 88.00, 1500, '瓶', '41%草甘膦异丙胺盐水剂，500ml/瓶', '高效除草，对作物安全，使用方便，见效快', '1. 定向喷雾，避免漂移；2. 杂草旺盛期使用效果好；3. 注意防护', 'https://via.placeholder.com/500x500/E64A19/ffffff?text=除草剂', '["https://via.placeholder.com/500x500/E64A19/ffffff?text=图1","https://via.placeholder.com/500x500/E64A19/ffffff?text=图2"]', 'active', 3)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 产品3插入成功');

    await query(`
      INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
      VALUES ('植物生长调节剂 - 赤霉素GA3', '调节剂', '品牌A', 98.00, 128.00, 500, '瓶', '赤霉素GA3，100ml/瓶', '调节作物生长，提高产量和品质，促进发芽和开花', '1. 严格按照浓度使用；2. 现配现用；3. 避免与碱性农药混用', 'https://via.placeholder.com/500x500/7B1FA2/ffffff?text=生长调节剂', '["https://via.placeholder.com/500x500/7B1FA2/ffffff?text=图1","https://via.placeholder.com/500x500/7B1FA2/ffffff?text=图2"]', 'active', 4)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 产品4插入成功');

    await query(`
      INSERT INTO products (name, category, brand, price, original_price, stock, unit, specifications, description, usage_instructions, precautions, image_url, gallery_urls, status, sort_order)
      VALUES ('叶面肥 - 大量元素水溶肥', '叶面肥', '品牌C', 45.00, 58.00, 2000, '袋', '大量元素水溶肥，500g/袋', '补充营养，增强抗性，提高品质，增加产量', '1. 稀释后叶面喷施；2. 间隔7-10天一次；3. 可与农药混用', 'https://via.placeholder.com/500x500/FF9800/ffffff?text=叶面肥', '["https://via.placeholder.com/500x500/FF9800/ffffff?text=图1","https://via.placeholder.com/500x500/FF9800/ffffff?text=图2"]', 'active', 5)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 产品5插入成功');

    const messages = [
      [1, '张三', '13800138000', 'zhangsan@example.com', '产品咨询', '您好，我想咨询一下你们的高效杀虫剂产品，请问对蚜虫的效果如何？使用方法是什么？', 'medium', 'pending', null, null, null, null],
      [2, '李四', '13900139000', 'lisi@example.com', '价格咨询', '你们的杀菌剂产品价格是多少？有没有批发优惠？', 'low', 'processing', null, null, null, null],
      [3, '王五', '13700137000', 'wangwu@example.com', '使用问题', '我购买的除草剂使用后效果不太理想，请问是什么原因？', 'high', 'replied', '您好，除草剂效果受多种因素影响，建议您联系我们的技术人员13800138000详细说明情况。', 1, new Date(), null],
      [null, '匿名客户', '13600136000', 'anonymous@example.com', '合作咨询', '我们是一家大型农场，希望能与贵公司建立长期合作关系，请问如何联系？', 'high', 'pending', null, null, null, null]
    ];
    for (const message of messages) {
      await query(`
        INSERT INTO messages (customer_id, name, phone, email, subject, content, priority, status, reply_content, replied_by, replied_at, close_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, message);
    }
    console.log('✅ 留言数据插入成功');

    const orderNo = 'OD' + Date.now();
    const orderResult = await query(`
      INSERT INTO orders (order_no, customer_id, contact_name, contact_phone, contact_email, shipping_address, total_amount, payment_method, payment_status, order_status, shipping_method, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNo, 1, '张三', '13800138000', 'zhangsan@example.com', '北京市朝阳区建国路123号 张三收', 880.00, '微信支付', 'paid', 'confirmed', '快递', '请尽快发货']);
    console.log('✅ 订单数据插入成功');

    await query(`
      INSERT INTO order_items (order_id, product_id, product_name, product_specifications, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [orderResult.insertId, 1, '高效杀虫剂 - 25%吡虫啉乳油', '25%吡虫啉乳油，100ml/瓶', 10, 88.00, 880.00]);
    console.log('✅ 订单明细插入成功');

    console.log('🎉 初始数据插入完成！');
    console.log('\n📊 数据统计：');
    console.log('• 用户：3个（管理员、经理、客服）');
    console.log('• 客户：5个');
    console.log('• 产品：5个');
    console.log('• 留言：4个');
    console.log('• 订单：1个');
    console.log('\n🔐 默认账号：');
    console.log('• 管理员：admin / admin123');
    console.log('• 经理：manager / admin123');
    console.log('• 客服：staff / admin123');
    return true;
  } catch (error) {
    console.error('❌ 数据插入失败:', error);
    return false;
  }
};

if (require.main === module) {
  seedData().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = seedData;
