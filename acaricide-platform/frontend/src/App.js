import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { Layout, Menu, Button, Input, Select, Card, Table, message } from 'antd';
import axios from 'axios';
import ECharts from 'echarts';
import './App.css';

const { Header, Content, Footer, Sider } = Layout;
const { Option } = Select;
const { Search } = Input;

// 首页组件
const Home = () => {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useState({
    crop: '',
    mite: '',
    ingredient: ''
  });
  const [loading, setLoading] = useState(false);

  // 获取产品列表
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
      } catch (error) {
        message.error('获取产品列表失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 搜索产品
  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/products/search', searchParams);
      setProducts(response.data);
    } catch (error) {
      message.error('搜索失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '产品名称',
      dataIndex: '名称',
      key: '名称',
    },
    {
      title: '有效成分',
      dataIndex: '有效成分',
      key: '有效成分',
    },
    {
      title: '生产企业',
      dataIndex: '生产企业',
      key: '生产企业',
    },
    {
      title: '登记号',
      dataIndex: '登记号',
      key: '登记号',
    },
    {
      title: '防治对象',
      dataIndex: '防治对象',
      key: '防治对象',
    },
    {
      title: '适用作物',
      dataIndex: '适用作物',
      key: '适用作物',
    },
  ];

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo">农用杀螨剂信息平台</div>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1"><Link to="/">首页</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/products">产品库</Link></Menu.Item>
          <Menu.Item key="3"><Link to="/stats">市场分析</Link></Menu.Item>
          <Menu.Item key="4"><Link to="/login">登录/注册</Link></Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        <Card title="搜索杀螨剂" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <Input
              placeholder="作物类型"
              value={searchParams.crop}
              onChange={(e) => setSearchParams({ ...searchParams, crop: e.target.value })}
              style={{ width: 200 }}
            />
            <Input
              placeholder="螨虫种类"
              value={searchParams.mite}
              onChange={(e) => setSearchParams({ ...searchParams, mite: e.target.value })}
              style={{ width: 200 }}
            />
            <Input
              placeholder="有效成分"
              value={searchParams.ingredient}
              onChange={(e) => setSearchParams({ ...searchParams, ingredient: e.target.value })}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </div>
        </Card>
        <Card title="产品列表">
          <Table
            columns={columns}
            dataSource={products}
            loading={loading}
            rowKey="产品ID"
          />
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        农用杀螨剂信息平台 ©2026
      </Footer>
    </Layout>
  );
};

// 产品详情组件
const ProductDetail = () => {
  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo">农用杀螨剂信息平台</div>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          <Menu.Item key="1"><Link to="/">首页</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/products">产品库</Link></Menu.Item>
          <Menu.Item key="3"><Link to="/stats">市场分析</Link></Menu.Item>
          <Menu.Item key="4"><Link to="/login">登录/注册</Link></Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        <Card title="产品详情">
          <p>产品详情页面</p>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        农用杀螨剂信息平台 ©2026
      </Footer>
    </Layout>
  );
};

// 市场分析组件
const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data);
        
        // 初始化图表
        if (response.data) {
          // 有效成分分布饼图
          const ingredientChart = ECharts.init(document.getElementById('ingredientChart'));
          ingredientChart.setOption({
            title: {
              text: '有效成分分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'item'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [
              {
                name: '有效成分',
                type: 'pie',
                radius: '50%',
                data: response.data.ingredient_distribution.map(item => ({
                  value: item.count,
                  name: item._id
                })),
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }
            ]
          });

          // 价格分布柱状图
          const priceChart = ECharts.init(document.getElementById('priceChart'));
          priceChart.setOption({
            title: {
              text: '价格分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            xAxis: {
              type: 'category',
              data: response.data.price_distribution.map(item => {
                if (item._id === '>100') return '>100元';
                return `${item._id}-${item._id + 10}元`;
              })
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                name: '产品数量',
                type: 'bar',
                data: response.data.price_distribution.map(item => item.count)
              }
            ]
          });

          // 防治对象分布饼图
          const targetChart = ECharts.init(document.getElementById('targetChart'));
          targetChart.setOption({
            title: {
              text: '防治对象分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'item'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [
              {
                name: '防治对象',
                type: 'pie',
                radius: '50%',
                data: response.data.target_distribution.map(item => ({
                  value: item.count,
                  name: item._id
                })),
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }
            ]
          });

          // 适用作物分布柱状图
          const cropChart = ECharts.init(document.getElementById('cropChart'));
          cropChart.setOption({
            title: {
              text: '适用作物分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            xAxis: {
              type: 'category',
              data: response.data.crop_distribution.map(item => item._id),
              axisLabel: {
                rotate: 45
              }
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                name: '产品数量',
                type: 'bar',
                data: response.data.crop_distribution.map(item => item.count)
              }
            ]
          });

          // 市场趋势折线图
          const trendChart = ECharts.init(document.getElementById('trendChart'));
          
          // 处理市场趋势数据
          const dates = [...new Set(response.data.market_trend.map(item => item.日期))];
          const productIds = [...new Set(response.data.market_trend.map(item => item.产品ID))];
          
          const series = productIds.map(productId => {
            const data = dates.map(date => {
              const item = response.data.market_trend.find(i => i.日期 === date && i.产品ID === productId);
              return item ? item.销量 : 0;
            });
            return {
              name: `产品${productId}`,
              type: 'line',
              data: data
            };
          });
          
          trendChart.setOption({
            title: {
              text: '市场趋势',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis'
            },
            legend: {
              data: productIds,
              bottom: 0
            },
            xAxis: {
              type: 'category',
              data: dates
            },
            yAxis: {
              type: 'value'
            },
            series: series
          });

          // 响应式调整
          window.addEventListener('resize', () => {
            ingredientChart.resize();
            priceChart.resize();
            targetChart.resize();
            cropChart.resize();
            trendChart.resize();
          });
        }
      } catch (error) {
        message.error('获取统计数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo">农用杀螨剂信息平台</div>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['3']}>
          <Menu.Item key="1"><Link to="/">首页</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/products">产品库</Link></Menu.Item>
          <Menu.Item key="3"><Link to="/stats">市场分析</Link></Menu.Item>
          <Menu.Item key="4"><Link to="/login">登录/注册</Link></Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        <Card title="市场统计" loading={loading}>
          {stats && (
            <div>
              <p>产品总数: {stats.product_count}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div id="ingredientChart" style={{ width: '100%', height: 300 }}></div>
                <div id="priceChart" style={{ width: '100%', height: 300 }}></div>
                <div id="targetChart" style={{ width: '100%', height: 300 }}></div>
                <div id="cropChart" style={{ width: '100%', height: 300 }}></div>
              </div>
              <div id="trendChart" style={{ width: '100%', height: 400 }}></div>
            </div>
          )}
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        农用杀螨剂信息平台 ©2026
      </Footer>
    </Layout>
  );
};

// 登录/注册组件
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '农户'
  });
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // 登录
        const response = await axios.post('http://localhost:5000/api/users/login', {
          username: formData.username,
          password: formData.password
        });
        message.success('登录成功');
        console.log(response.data);
      } else {
        // 注册
        const response = await axios.post('http://localhost:5000/api/users/register', formData);
        message.success('注册成功');
        console.log(response.data);
      }
    } catch (error) {
      message.error(isLogin ? '登录失败' : '注册失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo">农用杀螨剂信息平台</div>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['4']}>
          <Menu.Item key="1"><Link to="/">首页</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/products">产品库</Link></Menu.Item>
          <Menu.Item key="3"><Link to="/stats">市场分析</Link></Menu.Item>
          <Menu.Item key="4"><Link to="/login">登录/注册</Link></Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        <Card title={isLogin ? '登录' : '注册'} style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{ marginBottom: 16 }}
            />
            <Input.Password
              placeholder="密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ marginBottom: 16 }}
            />
            {!isLogin && (
              <Select
                defaultValue="农户"
                style={{ width: '100%', marginBottom: 16 }}
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
              >
                <Option value="农户">农户</Option>
                <Option value="经销商">经销商</Option>
                <Option value="科研人员">科研人员</Option>
              </Select>
            )}
            <Button type="primary" onClick={handleSubmit} loading={loading} style={{ width: '100%' }}>
              {isLogin ? '登录' : '注册'}
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button type="link" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
              </Button>
            </div>
          </div>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        农用杀螨剂信息平台 ©2026
      </Footer>
    </Layout>
  );
};

// 主应用组件
const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/products" component={ProductDetail} />
        <Route path="/stats" component={Stats} />
        <Route path="/login" component={Login} />
      </Switch>
    </Router>
  );
};

export default App;