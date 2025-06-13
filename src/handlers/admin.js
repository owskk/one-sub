import { generateAdminPage } from '../utils/html';

/**
 * 处理管理员请求
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleAdminRequest(request, env) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // 获取当前订阅数据
  let subscriptions = await getSubscriptions(env);
  
  // 处理管理操作
  if (request.method === 'POST') {
    if (action === 'addSource') {
      return await handleAddSource(request, env, subscriptions);
    } else if (action === 'deleteSource') {
      return await handleDeleteSource(request, env, subscriptions);
    }
  }
  
  // 生成管理页面
  const adminUrl = request.url.split('?')[0] + '?token=' + env.ADMIN_TOKEN;
  const html = generateAdminPage(subscriptions, adminUrl);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

/**
 * 获取订阅数据
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} - 订阅数据
 */
async function getSubscriptions(env) {
  let subscriptions = await env.SUBSCRIPTIONS.get('subscriptions');
  if (!subscriptions) {
    // 初始化订阅数据
    subscriptions = {
      sources: []
    };
    await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
  } else {
    subscriptions = JSON.parse(subscriptions);
  }
  return subscriptions;
}

/**
 * 处理添加订阅源
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @param {Object} subscriptions - 订阅数据
 * @returns {Promise<Response>} - 响应对象
 */
async function handleAddSource(request, env, subscriptions) {
  try {
    const data = await request.json();
    
    if (data.type === 'url') {
      if (!data.url || !data.url.trim()) {
        return new Response(JSON.stringify({
          success: false,
          error: '订阅链接不能为空'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证URL是否有效
      try {
        new URL(data.url);
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: '无效的URL格式'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 添加订阅链接
      subscriptions.sources.push({
        type: 'url',
        url: data.url
      });
    } else if (data.type === 'node') {
      if (!data.content || !data.content.trim()) {
        return new Response(JSON.stringify({
          success: false,
          error: '节点内容不能为空'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 添加节点
      subscriptions.sources.push({
        type: 'node',
        content: data.content
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: '无效的订阅源类型'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 保存订阅数据
    await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理删除订阅源
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @param {Object} subscriptions - 订阅数据
 * @returns {Promise<Response>} - 响应对象
 */
async function handleDeleteSource(request, env, subscriptions) {
  try {
    const data = await request.json();
    const index = data.index;
    
    if (index < 0 || index >= subscriptions.sources.length) {
      return new Response(JSON.stringify({
        success: false,
        error: '无效的索引'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 删除订阅源
    subscriptions.sources.splice(index, 1);
    
    // 保存订阅数据
    await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 