"""
农药行业趋势分析与预测工具
基于Minimax模型，分析行业数据并提供预测
"""

from minimax_client import MinimaxClient
import json
import time
from datetime import datetime

class PesticideTrendAnalyzer:
    """农药行业趋势分析与预测"""
    
    def __init__(self, api_key):
        """
        初始化分析器
        
        Args:
            api_key: Minimax API密钥
        """
        self.client = MinimaxClient(api_key=api_key)
        self.system_prompt = """
你是一位专业的农药行业分析师，擅长数据分析和趋势预测。请基于提供的信息，分析农药行业的发展趋势并进行预测。

你的分析应该包括：
1. 市场规模和增长趋势
2. 产品结构变化
3. 技术发展方向
4. 政策影响分析
5. 未来3-5年预测
6. 投资机会和风险

请使用专业、客观的语言，提供数据支持的分析结果。
        """
    
    def analyze_trends(self, data=None, time_horizon="未来3年"):
        """
        分析行业趋势
        
        Args:
            data: 行业数据（可选）
            time_horizon: 预测时间范围
            
        Returns:
            分析结果
        """
        if data:
            prompt = f"请基于以下数据，分析农药行业的发展趋势并预测{time_horizon}的发展：\n\n{data}"
        else:
            prompt = f"请分析当前农药行业的发展趋势，并预测{time_horizon}的发展，包括市场规模、产品结构、技术发展、政策影响等方面。"
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            result = self.client.chat_completion(
                messages=messages,
                model="abab6.5-chat",
                temperature=0.2,  # 降低随机性，提高分析准确性
                max_tokens=3000
            )
            
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            else:
                return f"错误: {result.get('error', '未知错误')}"
        except Exception as e:
            return f"系统错误: {str(e)}"
    
    def analyze_product_category(self, category):
        """
        分析特定产品类别
        
        Args:
            category: 产品类别
            
        Returns:
            分析结果
        """
        prompt = f"请详细分析{category}的市场现状、技术发展、竞争格局和未来趋势，包括：\n1. 市场规模和增长率\n2. 主要生产企业\n3. 技术发展方向\n4. 政策影响\n5. 未来3年预测"
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            result = self.client.chat_completion(
                messages=messages,
                model="abab6.5-chat",
                temperature=0.2,
                max_tokens=2000
            )
            
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            else:
                return f"错误: {result.get('error', '未知错误')}"
        except Exception as e:
            return f"系统错误: {str(e)}"
    
    def generate_report(self, report_type="综合分析"):
        """
        生成分析报告
        
        Args:
            report_type: 报告类型
            
        Returns:
            完整报告
        """
        report_templates = {
            "综合分析": "请生成一份农药行业综合分析报告，包括市场现状、发展趋势、技术创新、政策环境和未来预测。",
            "市场分析": "请生成一份农药市场分析报告，重点分析市场规模、增长趋势、区域分布和竞争格局。",
            "技术分析": "请生成一份农药技术发展分析报告，重点分析新技术、新产品和研发趋势。",
            "政策分析": "请生成一份农药政策分析报告，重点分析最新政策、法规变化及其影响。",
            "投资分析": "请生成一份农药行业投资分析报告，重点分析投资机会、风险和建议。"
        }
        
        prompt = report_templates.get(report_type, report_templates["综合分析"])
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            result = self.client.chat_completion(
                messages=messages,
                model="abab6.5-chat",
                temperature=0.2,
                max_tokens=4000
            )
            
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            else:
                return f"错误: {result.get('error', '未知错误')}"
        except Exception as e:
            return f"系统错误: {str(e)}"
    
    def save_report(self, report_content, report_type="综合分析"):
        """
        保存分析报告
        
        Args:
            report_content: 报告内容
            report_type: 报告类型
            
        Returns:
            保存路径
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"pesticide_trend_report_{report_type}_{timestamp}.md"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# 农药行业{report_type}报告\n\n")
            f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(report_content)
        
        return filename

def main():
    """主函数"""
    print("农药行业趋势分析与预测工具")
    print("=" * 60)
    
    # 初始化分析器
    api_key = "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ"
    analyzer = PesticideTrendAnalyzer(api_key=api_key)
    
    print("✅ 分析器初始化成功")
    print("\n功能菜单:")
    print("1. 行业趋势分析")
    print("2. 产品类别分析")
    print("3. 生成综合报告")
    print("4. 生成专题报告")
    print("0. 退出")
    
    while True:
        choice = input("\n请选择功能编号: ")
        
        if choice == "0":
            print("谢谢使用，再见！")
            break
        
        elif choice == "1":
            time_horizon = input("请输入预测时间范围（如：未来3年，未来5年等）: ")
            if not time_horizon:
                time_horizon = "未来3年"
            
            # 可选：输入行业数据
            use_data = input("是否输入行业数据？(y/n): ")
            data = None
            if use_data.lower() == "y":
                print("请输入行业数据（输入空行结束）:")
                data_lines = []
                while True:
                    line = input()
                    if not line:
                        break
                    data_lines.append(line)
                data = "\n".join(data_lines)
            
            print("\n正在分析行业趋势...")
            result = analyzer.analyze_trends(data, time_horizon)
            print("\n" + "=" * 60)
            print(f"农药行业{time_horizon}趋势分析")
            print("=" * 60)
            print(result)
            
            # 保存报告
            save = input("\n是否保存报告？(y/n): ")
            if save.lower() == "y":
                filepath = analyzer.save_report(result, "趋势分析")
                print(f"报告已保存到: {filepath}")
            
        elif choice == "2":
            category = input("请输入产品类别（如：生物农药，除草剂，杀虫剂等）: ")
            print("\n正在分析产品类别...")
            result = analyzer.analyze_product_category(category)
            print("\n" + "=" * 60)
            print(f"{category}分析报告")
            print("=" * 60)
            print(result)
            
            # 保存报告
            save = input("\n是否保存报告？(y/n): ")
            if save.lower() == "y":
                filepath = analyzer.save_report(result, category)
                print(f"报告已保存到: {filepath}")
            
        elif choice == "3":
            print("正在生成综合分析报告...")
            result = analyzer.generate_report("综合分析")
            print("\n" + "=" * 60)
            print("农药行业综合分析报告")
            print("=" * 60)
            print(result)
            
            # 保存报告
            save = input("\n是否保存报告？(y/n): ")
            if save.lower() == "y":
                filepath = analyzer.save_report(result, "综合分析")
                print(f"报告已保存到: {filepath}")
            
        elif choice == "4":
            print("请选择报告类型:")
            print("1. 市场分析")
            print("2. 技术分析")
            print("3. 政策分析")
            print("4. 投资分析")
            
            report_choice = input("请选择: ")
            report_types = {
                "1": "市场分析",
                "2": "技术分析",
                "3": "政策分析",
                "4": "投资分析"
            }
            
            report_type = report_types.get(report_choice, "市场分析")
            print(f"\n正在生成{report_type}报告...")
            result = analyzer.generate_report(report_type)
            print("\n" + "=" * 60)
            print(f"农药行业{report_type}报告")
            print("=" * 60)
            print(result)
            
            # 保存报告
            save = input("\n是否保存报告？(y/n): ")
            if save.lower() == "y":
                filepath = analyzer.save_report(result, report_type)
                print(f"报告已保存到: {filepath}")
        
        else:
            print("无效选择，请重新输入")


if __name__ == "__main__":
    main()
