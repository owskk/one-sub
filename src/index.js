import { Router } from 'itty-router';
import { verifyToken } from './utils/auth';
import { handleAdminRequest } from './handlers/admin';
import { handleSubscriptionRequest } from './handlers/subscription';
import { generateHtml } from './utils/html';

// 创建路由器
const router = Router();

// 主页路由
router.get('/', async (request, env) => {
  return new Response(generateHtml('订阅转换', `
    <h1>订阅转换服务</h1>
    <p>这是一个用于聚合和转换订阅的Cloudflare Worker服务。</p>
    <p>请使用管理员或访客令牌访问相应功能。</p>
  `), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
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