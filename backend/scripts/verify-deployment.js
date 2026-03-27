const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

let authToken = null;

const makeRequest = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

const runTests = async () => {
  console.log('=================================');
  console.log('🧪 开始部署验证测试');
  console.log('=================================\n');

  const tests = [
    {
      name: '服务器状态检查',
      path: '/',
      method: 'GET'
    },
    {
      name: '健康检查',
      path: '/api/health',
      method: 'GET'
    },
    {
      name: '就绪检查',
      path: '/api/health/ready',
      method: 'GET'
    },
    {
      name: '获取产品列表',
      path: '/api/products',
      method: 'GET'
    },
    {
      name: '用户登录测试',
      path: '/api/auth/login',
      method: 'POST',
      data: {
        username: 'admin',
        password: 'admin123'
      }
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`📝 测试: ${test.name}`);
      const result = await makeRequest(test.path, test.method, test.data);

      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`✅ 通过 - 状态码: ${result.statusCode}`);
        if (result.data.success !== undefined) {
          console.log(`   响应: ${result.data.success ? '成功' : '失败'}`);
        }
        
        if (test.name === '用户登录测试' && result.data.data && result.data.data.token) {
          authToken = result.data.data.token;
          console.log(`   已获取认证令牌`);
        }
        passedTests++;
      } else {
        console.log(`❌ 失败 - 状态码: ${result.statusCode}`);
        console.log(`   响应: ${JSON.stringify(result.data)}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      failedTests++;
    }
    console.log();
  }

  if (authToken) {
    console.log('=================================');
    console.log('🔐 使用认证令牌测试受保护端点');
    console.log('=================================\n');

    const authTests = [
      {
        name: '获取客户列表（需认证）',
        path: '/api/customers',
        method: 'GET',
        requireAuth: true
      },
      {
        name: '获取留言列表（需认证）',
        path: '/api/messages',
        method: 'GET',
        requireAuth: true
      }
    ];

    for (const test of authTests) {
      try {
        console.log(`📝 测试: ${test.name}`);
        const result = await makeRequest(test.path, test.method, null, authToken);

        if (result.statusCode >= 200 && result.statusCode < 300) {
          console.log(`✅ 通过 - 状态码: ${result.statusCode}`);
          if (result.data.success !== undefined) {
            console.log(`   响应: ${result.data.success ? '成功' : '失败'}`);
          }
          passedTests++;
        } else {
          console.log(`❌ 失败 - 状态码: ${result.statusCode}`);
          console.log(`   响应: ${JSON.stringify(result.data)}`);
          failedTests++;
        }
      } catch (error) {
        console.log(`❌ 错误: ${error.message}`);
        failedTests++;
      }
      console.log();
    }
  }

  const totalTests = tests.length + (authToken ? 2 : 0);
  console.log('=================================');
  console.log('📊 测试结果汇总');
  console.log('=================================');
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('=================================\n');

  if (failedTests === 0) {
    console.log('🎉 所有测试通过！部署验证成功！\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查日志。\n');
    process.exit(1);
  }
};

runTests();