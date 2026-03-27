const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_BASE_URL = 'http://localhost:8080';

const makeRequest = (url, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (url.includes('3000') ? 3000 : 8080),
      path: parsedUrl.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

const runIntegrationTests = async () => {
  console.log('=================================');
  console.log('🔗 前端-后端集成验证');
  console.log('=================================\n');

  const tests = [
    {
      name: '后端API服务器状态',
      url: `${API_BASE_URL}/`,
      type: 'backend'
    },
    {
      name: '后端健康检查',
      url: `${API_BASE_URL}/api/health`,
      type: 'backend'
    },
    {
      name: '前端首页访问',
      url: `${FRONTEND_BASE_URL}/index.html`,
      type: 'frontend'
    },
    {
      name: '后端产品API',
      url: `${API_BASE_URL}/api/products`,
      type: 'backend'
    },
    {
      name: '前端产品页面访问',
      url: `${FRONTEND_BASE_URL}/products.html`,
      type: 'frontend'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`📝 测试: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      const result = await makeRequest(test.url);

      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`✅ 通过 - 状态码: ${result.statusCode}`);
        console.log(`   类型: ${test.type === 'backend' ? '后端API' : '前端页面'}`);
        passedTests++;
      } else {
        console.log(`❌ 失败 - 状态码: ${result.statusCode}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      failedTests++;
    }
    console.log();
  }

  console.log('=================================');
  console.log('📊 集成测试结果汇总');
  console.log('=================================');
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📈 成功率: ${((passedTests / tests.length) * 100).toFixed(2)}%`);
  console.log('=================================\n');

  if (failedTests === 0) {
    console.log('🎉 前端-后端集成验证成功！');
    console.log('🌐 前端地址: http://localhost:8080');
    console.log('🚀 后端API: http://localhost:3000');
    console.log('\n✨ 您现在可以在浏览器中访问应用了！\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查服务状态。\n');
    process.exit(1);
  }
};

runIntegrationTests();