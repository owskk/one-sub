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
  const url = new URL(request.url);
  const newUrl = new URL('/index.html', url.origin);
  const indexRequest = new Request(newUrl.toString(), request);
  return env.ASSETS.fetch(indexRequest);
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
    
    // 尝试从静态资源中获取
    const url = new URL(request.url);
    if (url.pathname !== '/' && !url.pathname.startsWith('/sub')) {
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
  }
}; 