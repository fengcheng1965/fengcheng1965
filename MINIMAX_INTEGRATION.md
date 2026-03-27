# Minimax 模型集成指南

## 简介

本指南帮助您在当前环境中集成minimax模型，用于增强农药相关文章的分析和处理能力。

## 文件说明

1. **minimax_client.py** - Minimax API客户端核心模块
2. **minimax_example.py** - 使用示例和测试脚本
3. **MINIMAX_INTEGRATION.md** - 本说明文档

## 快速开始

### 步骤1：获取API密钥

1. 访问 minimax 官方网站：https://www.minimaxi.com/
2. 注册账号并登录
3. 在控制台获取API密钥

### 步骤2：配置API密钥

编辑 `minimax_example.py` 文件，替换API密钥：

```python
API_KEY = "your_actual_api_key_here"  # 替换为您的实际API密钥
```

### 步骤3：运行示例

```bash
python minimax_example.py
```

## 核心功能

### 1. 文本生成

```python
from minimax_client import MinimaxClient

client = MinimaxClient(api_key="your_api_key")
result = client.generate_text("请介绍生物农药的发展趋势")
print(result)
```

### 2. 多轮对话

```python
messages = [
    {"role": "user", "content": "什么是生物农药？"},
    {"role": "assistant", "content": "生物农药是指..."},
    {"role": "user", "content": "有哪些类型？"}
]

result = client.chat_completion(messages=messages)
```

### 3. 文章分析

```python
article_content = "文章内容..."
analysis = client.analyze_article(article_content)
print(analysis)
```

## 与现有系统集成

### 集成到公众号文章抓取工具

修改 `scraper.py`，添加minimax分析功能：

```python
from minimax_client import MinimaxClient

# 初始化minimax客户端
minimax_client = MinimaxClient(api_key="your_api_key")

def analyze_with_minimax(article_content):
    """使用minimax深度分析文章"""
    analysis = minimax_client.analyze_article(article_content)
    return analysis

# 在生成报告时调用
for article in articles:
    deep_analysis = analyze_with_minimax(article['content'])
    # 将分析结果添加到报告中
```

### 增强文章评分

```python
def enhanced_scoring(article, minimax_client):
    """结合minimax的增强评分"""
    # 基础评分
    base_score = analyze_article(article)['score']
    
    # minimax深度分析
    minimax_analysis = minimax_client.analyze_article(article['content'])
    minimax_score = minimax_analysis.get('score', 5)
    
    # 综合评分
    final_score = (base_score + minimax_score * 10) / 2
    return final_score
```

## API参数说明

### 支持的模型

- `abab6.5-chat` - 默认模型，适合大多数场景
- `abab6-chat` - 轻量级模型
- `abab5.5-chat` - 上一代模型

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| temperature | float | 0.7 | 控制随机性，0-1之间 |
| max_tokens | int | 2000 | 最大生成token数 |
| stream | bool | False | 是否流式输出 |

## 使用场景

### 1. 文章质量评估

使用minimax对抓取的文章进行深度质量评估，提高筛选准确性。

### 2. 内容摘要生成

自动生成文章摘要，便于快速浏览大量文章。

### 3. 主题分类优化

利用minimax的语义理解能力，更准确地分类文章主题。

### 4. 趋势分析

分析多篇文章，提取行业发展趋势和关键信息。

## 注意事项

1. **API费用**：minimax API调用会产生费用，请注意控制调用频率
2. **速率限制**：注意API的速率限制，避免频繁调用
3. **错误处理**：建议添加完善的错误处理机制
4. **数据安全**：妥善保管API密钥，不要泄露

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查API密钥是否正确
   - 确认密钥是否有足够余额

2. **网络连接问题**
   - 检查网络连接
   - 确认可以访问 https://api.minimax.chat

3. **超时错误**
   - 增加超时时间
   - 减少max_tokens参数

### 获取帮助

- minimax官方文档：https://www.minimaxi.com/document
- API状态页面：https://status.minimaxi.com

## 更新日志

### v1.0.0 (2026-03-26)
- 初始版本
- 支持基本的文本生成和对话功能
- 支持文章分析功能
- 提供完整的示例代码

## 许可证

MIT License

---

如有问题或建议，请随时反馈！
