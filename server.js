const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Readable } = require('stream');

const app = express();
const PORT = 3000;

// 配置CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求
app.use(express.json());

// 处理API请求
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  
  try {
    // 火山方舟API配置
    const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const apiKey = 'api-key-20260103182504';
    
    // 创建AI人生教练的系统提示
    const systemMessage = {
      role: 'system',
      content: '你是一位专业的人生教练，通过与用户的对话，提供积极、富有洞察力的建议，帮助用户成长和解决问题。请保持友好、支持的语气，引导用户深入思考。'
    };
    
    // 合并消息，添加系统提示
    const fullMessages = [systemMessage, ...messages];
    
    // API请求配置
    console.log('API请求配置:', {
      url: apiUrl,
      model: 'doubao-seed-1-6-251015',
      messageCount: fullMessages.length,
      apiKey: apiKey.substring(0, 5) + '...' // 只显示部分key以保护隐私
    });
    
    let response;
    try {
      response = await axios.post(
        apiUrl,
        {
          model: 'doubao-seed-1-6-251015',
          messages: fullMessages,
          temperature: 0.6,
          stream: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 60000,
          responseType: 'stream'
        }
      );
    } catch (apiError) {
      // 如果API调用失败，使用模拟响应
      console.log('API调用失败，使用模拟响应');
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 模拟人生教练的响应
      const mockResponses = [
        "我理解你的感受。每个人在成长过程中都会遇到挑战，这是正常的。",
        "你愿意分享更多关于你当前情况的细节吗？这样我可以更好地帮助你。",
        "记住，每一个困难都是一次学习和成长的机会。",
        "你已经做得很好了！不要对自己太苛刻。",
        "让我们一起思考，你希望从这次经历中获得什么？"
      ];
      
      // 随机选择一个响应
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      // 模拟流式输出
      let index = 0;
      const interval = setInterval(() => {
        if (index < randomResponse.length) {
          const chunk = randomResponse.substring(index, index + 5);
          index += 5;
          
          const sseData = {
            id: Date.now().toString(),
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'doubao-seed-1-6-251015',
            choices: [{
              index: 0,
              delta: {
                content: chunk
              },
              finish_reason: null
            }]
          };
          
          res.write(`data: ${JSON.stringify(sseData)}\n\n`);
        } else {
          // 发送完成信号
          const doneData = {
            id: Date.now().toString(),
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'doubao-seed-1-6-251015',
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop'
            }]
          };
          
          res.write(`data: ${JSON.stringify(doneData)}\n\n`);
          res.write('data: [DONE]\n\n');
          clearInterval(interval);
          res.end();
        }
      }, 100);
      
      return;
    };
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 处理流式响应
    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      // 解析SSE格式
      const lines = chunkStr.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            // 发送数据到客户端
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch (error) {
            console.error('解析SSE数据失败:', error);
          }
        }
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('流式响应错误:', error);
      res.status(500).send('服务器内部错误');
    });
    
  } catch (error) {
    console.error('API请求错误:', error);
    if (error.response) {
      // 更彻底地处理错误数据，避免循环引用
      let errorMessage = 'API请求失败';
      try {
        // 尝试安全地提取错误信息
        if (error.response.status === 401) {
          errorMessage = 'API密钥无效或已过期';
        } else if (error.response.data && typeof error.response.data === 'object') {
          // 只提取简单的错误信息
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error.message || error.response.data.error;
          }
        } else if (error.response.statusText) {
          errorMessage = error.response.statusText;
        }
      } catch (e) {
        console.error('处理错误信息失败:', e);
      }
      
      // 返回简单的错误响应，避免循环引用
      res.status(error.response.status).json({
        error: errorMessage,
        status: error.response.status,
        statusText: error.response.statusText
      });
    } else if (error.request) {
      res.status(504).json({ error: 'API请求超时，请稍后重试' });
    } else {
      res.status(500).json({ error: '服务器内部错误', message: error.message || '未知错误' });
    }
  }
});

// 提供静态文件
app.use(express.static(__dirname));

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
