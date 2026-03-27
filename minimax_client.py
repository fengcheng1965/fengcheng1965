"""
Minimax API 客户端
用于在当前环境中集成minimax模型
"""

import requests
import json
from typing import Optional, Dict, Any, List

class MinimaxClient:
    """Minimax API 客户端"""
    
    def __init__(self, api_key: str, group_id: Optional[str] = None):
        """
        初始化Minimax客户端
        
        Args:
            api_key: Minimax API密钥
            group_id: Minimax Group ID（可选）
        """
        self.api_key = api_key
        self.group_id = group_id
        self.base_url = "https://api.minimax.chat/v1"
        
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "abab6.5-chat",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        调用Minimax聊天补全API
        
        Args:
            messages: 消息列表，格式为 [{"role": "user", "content": "..."}]
            model: 模型名称，默认 abab6.5-chat
            temperature: 温度参数，控制随机性
            max_tokens: 最大生成token数
            stream: 是否使用流式输出
            
        Returns:
            API响应结果
        """
        url = f"{self.base_url}/text/chatcompletion_v2"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        if self.group_id:
            payload["group_id"] = self.group_id
            
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"API请求失败: {str(e)}"}
        except json.JSONDecodeError as e:
            return {"error": f"JSON解析失败: {str(e)}"}
    
    def generate_text(
        self,
        prompt: str,
        model: str = "abab6.5-chat",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        简化的文本生成接口
        
        Args:
            prompt: 输入提示词
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大生成token数
            
        Returns:
            生成的文本内容
        """
        messages = [{"role": "user", "content": prompt}]
        
        result = self.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        if "error" in result:
            return f"错误: {result['error']}"
        
        try:
            return result["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            return f"解析响应失败: {str(e)}"
    
    def analyze_article(self, article_content: str) -> Dict[str, Any]:
        """
        使用Minimax分析文章内容
        
        Args:
            article_content: 文章内容
            
        Returns:
            分析结果
        """
        prompt = f"""请分析以下农药相关文章，提取关键信息：

文章内容：
{article_content[:2000]}  # 限制长度避免超出token限制

请分析：
1. 文章主题（畅销品排名/产品评价/协同增效/技术实践/政策法规/生物农业）
2. 主要观点
3. 关键数据
4. 文章质量评分（1-10分）

请以JSON格式返回结果。"""

        response = self.generate_text(prompt, temperature=0.3)
        
        try:
            # 尝试解析JSON响应
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "analysis": response,
                "topic": "unknown",
                "score": 5
            }


# 使用示例
if __name__ == "__main__":
    # 示例：初始化客户端（需要替换为实际的API密钥）
    # client = MinimaxClient(api_key="your_api_key_here")
    
    # 示例：生成文本
    # result = client.generate_text("请介绍一下生物农药的发展趋势")
    # print(result)
    
    print("Minimax客户端已加载")
    print("使用方法：")
    print("1. 获取API密钥：https://www.minimaxi.com/")
    print("2. 初始化客户端：client = MinimaxClient(api_key='your_key')")
    print("3. 调用API：result = client.generate_text('你的问题')")
