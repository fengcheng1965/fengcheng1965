const http = require('http');

const ADMIN_BASE_URL = 'http://localhost:8081';

const makeRequest = (url, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url, ADMIN_BASE_URL);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8081,
      path: parsedUrl.pathname,
      method: method,
      headers: {
        'Content-Type': 'text/html'
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

const runTests = async () => {
  console.log('=================================');
  console.log('🧪 管理后台功能测试');
  console.log('=================================\n');

  const tests = [
    {
      name: '管理后台主页访问',
      path: '/index.html',
      type: '主页'
    },
    {
      name: '配置编辑器页面访问',
      path: '/pages/config-editor.html',
      type: '配置编辑器'
    },
    {
      name: 'CSS样式文件加载',
      path: '/css/admin.css',
      type: '样式文件'
    },
    {
      name: 'JavaScript文件加载',
      path: '/js/admin.js',
      type: '脚本文件'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`📝 测试: ${test.name}`);
      const result = await makeRequest(test.path);

      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`✅ 通过 - 状态码: ${result.statusCode}`);
        console.log(`   类型: ${test.type}`);
        console.log(`   大小: ${result.data.length} 字节`);
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
  console.log('📊 测试结果汇总');
  console.log('=================================');
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📈 成功率: ${((passedTests / tests.length) * 100).toFixed(2)}%`);
  console.log('=================================\n');

  if (failedTests === 0) {
    console.log('🎉 所有测试通过！管理后台功能正常！\n');
    console.log('🌐 访问地址: http://localhost:8081');
    console.log('📋 主要功能:');
    console.log('   • 仪表盘 - 系统概览和性能监控');
    console.log('   • 服务管理 - 启动/停止/重启服务');
    console.log('   • 数据模型 - 管理数据库模型');
    console.log('   • 接口配置 - 配置API端点');
    console.log('   • 权限管理 - 管理用户角色和权限');
    console.log('   • 实时监控 - 监控系统资源使用');
    console.log('   • 日志查看 - 查看系统日志');
    console.log('   • 系统设置 - 配置系统参数');
    console.log('   • 配置编辑器 - 拖拽式接口配置\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查服务状态。\n');
    process.exit(1);
  }
};

runTests();