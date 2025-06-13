import { generateAdminPage } from '../utils/html';
import { generateHtml } from '../utils/html';

/**
 * 处理管理员请求
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleAdminRequest(request, env) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    // 获取当前订阅数据
    let subscriptions = await getSubscriptions(env);
    
    // 处理管理操作
    if (request.method === 'POST') {
      if (action === 'addSource') {
        return await handleAddSource(request, env, subscriptions);
      } else if (action === 'deleteSource') {
        return await handleDeleteSource(request, env, subscriptions);
      } else if (action === 'testSource') {
        return await handleTestSource(request, env);
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: '未知操作'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 生成管理页面
    const adminUrl = request.url.split('?')[0] + '?token=' + env.ADMIN_TOKEN;
    const html = generateAdminPage(subscriptions, adminUrl);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  } catch (error) {
    console.error('处理管理员请求失败:', error);
    
    if (request.headers.get('Accept')?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(generateHtml('错误', `
        <div class="error-container">
          <h1>处理请求出错</h1>
          <p class="error">${error.message}</p>
          <a href="${request.url.split('?')[0]}?token=${env.ADMIN_TOKEN}" class="btn">返回管理页面</a>
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
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
  }
}

/**
 * 获取订阅数据
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} - 订阅数据
 */
async function getSubscriptions(env) {
  try {
    let subscriptions = await env.SUBSCRIPTIONS.get('subscriptions');
    if (!subscriptions) {
      // 初始化订阅数据
      subscriptions = {
        sources: []
      };
      await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
      console.log('管理员：初始化订阅数据完成');
    } else {
      try {
        subscriptions = JSON.parse(subscriptions);
      } catch (error) {
        console.error('解析订阅数据失败:', error);
        // 重置订阅数据
        subscriptions = {
          sources: []
        };
        await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
        console.log('管理员：重置订阅数据完成');
      }
    }
    return subscriptions;
  } catch (error) {
    console.error('获取订阅数据失败:', error);
    // 返回空数据结构，防止程序崩溃
    return {
      sources: []
    };
  }
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
      
      // 检查是否已存在相同的URL
      const existingUrlIndex = subscriptions.sources.findIndex(
        source => source.type === 'url' && source.url === data.url
      );
      
      if (existingUrlIndex !== -1) {
        return new Response(JSON.stringify({
          success: false,
          error: '该订阅链接已存在'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 添加订阅链接
      subscriptions.sources.push({
        type: 'url',
        url: data.url,
        addedAt: new Date().toISOString()
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
      
      // 检查是否已存在相同的节点内容
      const existingNodeIndex = subscriptions.sources.findIndex(
        source => source.type === 'node' && source.content === data.content
      );
      
      if (existingNodeIndex !== -1) {
        return new Response(JSON.stringify({
          success: false,
          error: '该节点内容已存在'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 添加节点
      subscriptions.sources.push({
        type: 'node',
        content: data.content,
        addedAt: new Date().toISOString()
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
    console.log('添加订阅源成功');
    
    return new Response(JSON.stringify({
      success: true,
      message: '添加成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('添加订阅源失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '添加订阅源失败: ' + error.message
    }), {
      status: 500,
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
    
    if (index === undefined || index === null) {
      return new Response(JSON.stringify({
        success: false,
        error: '未指定索引'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (index < 0 || index >= subscriptions.sources.length) {
      return new Response(JSON.stringify({
        success: false,
        error: '无效的索引'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 删除订阅源
    const deletedSource = subscriptions.sources.splice(index, 1)[0];
    
    // 保存订阅数据
    await env.SUBSCRIPTIONS.put('subscriptions', JSON.stringify(subscriptions));
    console.log('删除订阅源成功');
    
    return new Response(JSON.stringify({
      success: true,
      message: '删除成功',
      deletedSource
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('删除订阅源失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '删除订阅源失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理测试订阅源
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Promise<Response>} - 响应对象
 */
async function handleTestSource(request, env) {
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
      
      // 测试订阅链接
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        const response = await fetch(data.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: controller.signal,
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return new Response(JSON.stringify({
            success: false,
            error: `获取订阅失败，状态码: ${response.status}`
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const content = await response.text();
        if (!content || content.trim() === '') {
          return new Response(JSON.stringify({
            success: false,
            error: '订阅内容为空'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 尝试解析内容
        let nodeCount = 0;
        try {
          const decodedContent = atob(content.trim());
          const lines = decodedContent.split('\n');
          nodeCount = lines.filter(line => line.trim()).length;
        } catch (e) {
          // 如果不是base64编码，直接按行分割
          const lines = content.split('\n');
          nodeCount = lines.filter(line => line.trim()).length;
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: '测试成功',
          nodeCount
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        const errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
        return new Response(JSON.stringify({
          success: false,
          error: '测试订阅失败: ' + errorMessage
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: '仅支持测试URL类型的订阅源'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('测试订阅源失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '测试订阅源失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 