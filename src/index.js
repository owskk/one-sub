import { Router } from 'itty-router';
import { verifyToken } from './utils/auth';
import { handleAdminRequest } from './handlers/admin';
import { handleSubscriptionRequest } from './handlers/subscription';
import { generateHtml } from './utils/html';

// 创建路由器
const router = Router();

// 主页路由
router.get('/', async (request, env) => {
  // 返回静态HTML页面
  try {
    const url = new URL(request.url);
    const newUrl = new URL('/index.html', url.origin);
    const indexRequest = new Request(newUrl.toString(), request);
    return env.ASSETS.fetch(indexRequest);
  } catch (error) {
    console.error('获取首页失败:', error);
    // 如果静态资源不可用，返回简单的HTML页面
    return new Response(generateHtml('订阅转换', `
      <div class="hero">
        <h1>One Sub 订阅转换</h1>
        <p class="subtitle">聚合和转换多种代理订阅的Cloudflare Worker服务</p>
      </div>
      
      <div class="login-form card">
        <div class="tabs">
          <div class="tab active" onclick="switchTab('visitor')">访客登录</div>
          <div class="tab" onclick="switchTab('admin')">管理员登录</div>
        </div>
        
        <div id="visitor-tab" class="tab-content active">
          <h3>访客模式</h3>
          <p>使用访客令牌查看订阅信息</p>
          <input type="password" id="visitor-token" placeholder="请输入访客令牌">
          <button class="btn primary" onclick="accessSubscription('visitor')">访问订阅</button>
        </div>
        
        <div id="admin-tab" class="tab-content">
          <h3>管理员模式</h3>
          <p>使用管理员令牌管理订阅源</p>
          <input type="password" id="admin-token" placeholder="请输入管理员令牌">
          <button class="btn primary" onclick="accessSubscription('admin')">管理订阅</button>
        </div>
      </div>
      
      <div class="features">
        <div class="feature-card">
          <h3>订阅聚合</h3>
          <p>支持多种订阅源聚合，包括URL链接和直接节点</p>
        </div>
        <div class="feature-card">
          <h3>格式转换</h3>
          <p>支持转换为多种客户端格式，如Clash、Shadowrocket、Quantumult等</p>
        </div>
        <div class="feature-card">
          <h3>安全可靠</h3>
          <p>使用Cloudflare Workers，高速稳定且安全</p>
        </div>
      </div>
      
      <footer>
        <p>© ${new Date().getFullYear()} One Sub - 基于Cloudflare Workers构建</p>
      </footer>
      
      <style>
        .hero {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .hero h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          color: var(--primary-color);
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 30px;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin: 40px 0;
        }
        
        .feature-card {
          padding: 25px;
          border-radius: 8px;
          background-color: var(--card-bg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        .feature-card h3 {
          color: var(--primary-color);
          margin-top: 0;
        }
        
        footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }
      </style>
      
      <script>
        function switchTab(tabName) {
          // 隐藏所有标签内容
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // 取消所有标签的激活状态
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // 激活选中的标签和内容
          document.getElementById(tabName + '-tab').classList.add('active');
          document.querySelector('.tab[onclick="switchTab(\\'' + tabName + '\\')"]').classList.add('active');
        }
        
        function accessSubscription(type) {
          let token;
          if (type === 'visitor') {
            token = document.getElementById('visitor-token').value.trim();
          } else {
            token = document.getElementById('admin-token').value.trim();
          }
          
          if (!token) {
            alert('请输入访问令牌');
            return;
          }
          
          window.location.href = '/sub?token=' + token;
        }
      </script>
    `), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
});

// 订阅路由
router.all('/sub', async (request, env) => {
  const { authenticated, isAdmin } = verifyToken(request, env.ADMIN_TOKEN, env.VISITOR_TOKEN);
  
  if (!authenticated) {
    return new Response(generateHtml('未授权访问', `
      <div class="error-container">
        <h1>未授权访问</h1>
        <p class="error">您提供的访问令牌无效</p>
        <a href="/" class="btn">返回首页</a>
      </div>
      
      <style>
        .error-container {
          text-align: center;
          padding: 40px 20px;
        }
        
        .error {
          color: var(--danger-color);
          font-size: 1.1rem;
          margin-bottom: 30px;
        }
      </style>
    `), {
      status: 401,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
  
  // 检查并自动创建KV命名空间
  if (!env.SUBSCRIPTIONS) {
    return new Response(generateHtml('配置错误', `
      <div class="error-container">
        <h1>配置错误</h1>
        <p class="error">KV命名空间未配置。请确保在wrangler.json中正确配置了SUBSCRIPTIONS命名空间。</p>
        <div class="code-block">
          <h3>请参考以下步骤：</h3>
          <ol>
            <li>创建KV命名空间：<code>npx wrangler kv:namespace create SUBSCRIPTIONS</code></li>
            <li>创建预览KV命名空间：<code>npx wrangler kv:namespace create SUBSCRIPTIONS --preview</code></li>
            <li>更新wrangler.json文件中的KV命名空间ID</li>
          </ol>
        </div>
        <a href="/" class="btn">返回首页</a>
      </div>
      
      <style>
        .error-container {
          text-align: center;
          padding: 40px 20px;
        }
        
        .error {
          color: var(--danger-color);
          font-size: 1.1rem;
          margin-bottom: 30px;
        }
        
        .code-block {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: left;
          margin: 20px 0;
          border: 1px solid var(--border-color);
        }
        
        .code-block ol {
          margin-left: 20px;
        }
        
        code {
          background-color: #e9ecef;
          padding: 3px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
      </style>
    `), {
      status: 500,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
  
  if (isAdmin) {
    return handleAdminRequest(request, env);
  } else {
    return handleSubscriptionRequest(request, env);
  }
});

// 处理请求
export default {
  async fetch(request, env, ctx) {
    // 处理CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    try {
      // 创建内存KV存储作为备用
      if (!env.SUBSCRIPTIONS) {
        console.log('KV命名空间未配置，创建内存KV存储作为备用');
        env.SUBSCRIPTIONS = createMemoryKVStore();
        
        // 初始化订阅数据
        const initialData = {
          sources: []
        };
        await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(initialData));
      }
      
      // 尝试从静态资源中获取
      const url = new URL(request.url);
      if (url.pathname !== '/' && !url.pathname.startsWith('/sub') && env.ASSETS) {
        try {
          return await env.ASSETS.fetch(request);
        } catch (e) {
          // 如果静态资源不存在，继续处理其他路由
        }
      }
      
      // 添加CORS头
      const response = await router.handle(request, env, ctx);
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('处理请求失败:', error);
      return new Response(generateHtml('服务器错误', `
        <div class="error-container">
          <h1>服务器错误</h1>
          <p class="error">${error.message}</p>
          <a href="/" class="btn">返回首页</a>
        </div>
        
        <style>
          .error-container {
            text-align: center;
            padding: 40px 20px;
          }
          
          .error {
            color: var(--danger-color);
            font-size: 1.1rem;
            margin-bottom: 30px;
          }
        </style>
      `), {
        status: 500,
        headers: { 
          'Content-Type': 'text/html;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

/**
 * 创建内存KV存储作为备用
 * @returns {Object} - 内存KV存储对象
 */
function createMemoryKVStore() {
  const store = new Map();
  
  return {
    get: async (key) => {
      console.log(`[内存KV] 获取键: ${key}`);
      return store.get(key);
    },
    put: async (key, value) => {
      console.log(`[内存KV] 存储键: ${key}`);
      store.set(key, value);
      return true;
    },
    delete: async (key) => {
      console.log(`[内存KV] 删除键: ${key}`);
      return store.delete(key);
    },
    list: async () => {
      console.log('[内存KV] 列出所有键');
      return {
        keys: Array.from(store.keys()).map(key => ({ name: key }))
      };
    }
  };
} 