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
      <h1>订阅转换服务</h1>
      <p>这是一个用于聚合和转换订阅的Cloudflare Worker服务。</p>
      <p>请使用管理员或访客令牌访问相应功能。</p>
      
      <div class="login-form card">
        <div class="tabs">
          <div class="tab active" onclick="switchTab('visitor')">访客登录</div>
          <div class="tab" onclick="switchTab('admin')">管理员登录</div>
        </div>
        
        <div id="visitor-tab" class="tab-content active">
          <h3>访客登录</h3>
          <input type="password" id="visitor-token" placeholder="请输入访客令牌">
          <button class="btn" onclick="accessSubscription('visitor')">访问订阅</button>
        </div>
        
        <div id="admin-tab" class="tab-content">
          <h3>管理员登录</h3>
          <input type="password" id="admin-token" placeholder="请输入管理员令牌">
          <button class="btn" onclick="accessSubscription('admin')">管理订阅</button>
        </div>
      </div>
      
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
    return new Response('未授权访问', {
      status: 401,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    });
  }
  
  // 检查并自动创建KV命名空间
  if (!env.SUBSCRIPTIONS) {
    return new Response(generateHtml('配置错误', `
      <h1>配置错误</h1>
      <p class="error">KV命名空间未配置。请确保在wrangler.toml中正确配置了SUBSCRIPTIONS命名空间。</p>
      <p>请参考以下步骤：</p>
      <ol>
        <li>创建KV命名空间：<code>npx wrangler kv:namespace create SUBSCRIPTIONS</code></li>
        <li>创建预览KV命名空间：<code>npx wrangler kv:namespace create SUBSCRIPTIONS --preview</code></li>
        <li>更新wrangler.toml文件中的KV命名空间ID</li>
      </ol>
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
        <h1>服务器错误</h1>
        <p class="error">${error.message}</p>
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