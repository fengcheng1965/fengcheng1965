import scrapy
from scrapy.crawler import CrawlerProcess
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 连接MongoDB
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
db = client['acaricide_platform']

class AcaricideSpider(scrapy.Spider):
    name = 'acaricide_spider'
    start_urls = [
        'http://www.chinapesticide.org.cn/service/select.htm',  # 中国农药信息网
    ]
    
    def parse(self, response):
        # 解析页面，提取杀螨剂信息
        # 这里需要根据实际网站结构进行调整
        products = []
        
        # 模拟数据，实际应用中需要从页面提取
        sample_products = [
            {
                '产品ID': 'AC001',
                '名称': '阿维菌素',
                '有效成分': '阿维菌素',
                '含量': '1.8%',
                '登记号': 'PD20180001',
                '生产企业': 'XX农药有限公司',
                '防治对象': '红蜘蛛',
                '适用作物': '柑橘、苹果、棉花',
                '使用方法': '稀释1000-1500倍液喷雾',
                '毒性': '低毒',
                '价格': 25.0,
                '市场份额': 15.2,
                '地区分布': {'华东': 30, '华南': 25, '华北': 20, '西南': 15, '东北': 10},
                '评价': []
            },
            {
                '产品ID': 'AC002',
                '名称': '螺螨酯',
                '有效成分': '螺螨酯',
                '含量': '24%',
                '登记号': 'PD20190002',
                '生产企业': 'YY农药有限公司',
                '防治对象': '红蜘蛛、白蜘蛛',
                '适用作物': '柑橘、苹果、葡萄',
                '使用方法': '稀释2000-3000倍液喷雾',
                '毒性': '低毒',
                '价格': 45.0,
                '市场份额': 12.8,
                '地区分布': {'华东': 25, '华南': 30, '华北': 15, '西南': 20, '东北': 10},
                '评价': []
            },
            {
                '产品ID': 'AC003',
                '名称': '乙螨唑',
                '有效成分': '乙螨唑',
                '含量': '10%',
                '登记号': 'PD20200003',
                '生产企业': 'ZZ农药有限公司',
                '防治对象': '红蜘蛛',
                '适用作物': '柑橘、苹果、棉花',
                '使用方法': '稀释1500-2000倍液喷雾',
                '毒性': '低毒',
                '价格': 35.0,
                '市场份额': 10.5,
                '地区分布': {'华东': 20, '华南': 25, '华北': 25, '西南': 15, '东北': 15},
                '评价': []
            }
        ]
        
        # 将数据存入MongoDB
        for product in sample_products:
            # 检查产品是否已存在
            existing_product = db.products.find_one({'产品ID': product['产品ID']})
            if not existing_product:
                db.products.insert_one(product)
                self.logger.info(f'插入产品: {product["名称"]}')
            else:
                self.logger.info(f'产品已存在: {product["名称"]}')

# 运行爬虫
def run_spider():
    process = CrawlerProcess(settings={
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    process.crawl(AcaricideSpider)
    process.start()

if __name__ == '__main__':
    run_spider()