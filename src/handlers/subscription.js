import { aggregateSubscriptions, convertSubscription, getClientSubscriptionUrls } from '../utils/subscription';
import { generateSubscriptionPage } from '../utils/html';
import { generateHtml } from '../utils/html';

/**
 * 处理订阅请求
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleSubscriptionRequest(request, env) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');
  
  try {
    // 获取订阅数据
    let subscriptions = await getSubscriptions(env);
    
    // 检查是否有订阅源
    if (!subscriptions.sources || subscriptions.sources.length === 0) {
      return new Response(generateHtml('无订阅源', `
        <div class="error-container">
          <h1>无订阅源</h1>
          <p class="error">没有配置订阅源，请先添加订阅源</p>
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
        status: 404,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    // 聚合订阅源
    const aggregatedContent = await aggregateSubscriptions(subscriptions.sources);
    
    // 检查聚合后的内容是否为空
    if (!aggregatedContent.trim()) {
      return new Response(generateHtml('订阅内容为空', `
        <div class="error-container">
          <h1>订阅内容为空</h1>
          <p class="error">聚合后的订阅内容为空，请检查订阅源是否有效</p>
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
        status: 404,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    // 如果指定了格式，进行转换
    if (format) {
      try {
        console.log(`开始转换订阅格式: ${format}, 使用API: ${env.SUB_CONVERT_API}`);
        const convertedContent = await convertSubscription(aggregatedContent, format, env.SUB_CONVERT_API);
        return new Response(convertedContent, {
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
        });
      } catch (error) {
        console.error(`订阅转换失败: ${error.message}`);
        return new Response(generateHtml('转换失败', `
          <div class="error-container">
            <h1>订阅转换失败</h1>
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
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }
    
    // 如果没有指定格式，返回订阅信息页面
    const baseUrl = request.url.split('?')[0];
    const token = url.searchParams.get('token');
    const subscriptionUrl = `${baseUrl}?token=${token}`;
    const clientUrls = getClientSubscriptionUrls(baseUrl, token);
    
    try {
      const html = await generateSubscriptionPage(subscriptionUrl, clientUrls);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    } catch (error) {
      console.error('生成订阅页面失败:', error);
      return new Response(generateHtml('生成页面失败', `
        <div class="error-container">
          <h1>生成订阅页面失败</h1>
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
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
  } catch (error) {
    console.error('处理订阅请求失败:', error);
    return new Response(generateHtml('服务器错误', `
      <div class="error-container">
        <h1>处理订阅请求失败</h1>
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
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
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
      console.log('初始化订阅数据完成');
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
        console.log('重置订阅数据完成');
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

// 转换订阅格式
async function convertSubscription(url, format, env) {
  try {
    const convertApi = env.SUB_CONVERT_API || 'https://api.v1.mk/sub';
    const convertUrl = `${convertApi}?target=${format}&url=${encodeURIComponent(url)}`;
    
    console.log(`订阅转换URL: ${convertUrl}`);
    
    const response = await fetch(convertUrl);
    if (!response.ok) {
      console.error(`订阅转换失败: 状态码: ${response.status}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`订阅转换出错:`, error);
    return null;
  }
} 