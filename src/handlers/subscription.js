import { aggregateSubscriptions, convertSubscription, getClientSubscriptionUrls } from '../utils/subscription';
import { generateSubscriptionPage } from '../utils/html';

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
    
    // 聚合订阅源
    const aggregatedContent = await aggregateSubscriptions(subscriptions.sources);
    
    // 如果指定了格式，进行转换
    if (format) {
      const convertedContent = await convertSubscription(aggregatedContent, format, env.SUB_CONVERT_API);
      return new Response(convertedContent, {
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
      });
    }
    
    // 如果没有指定格式，返回订阅信息页面
    const baseUrl = request.url.split('?')[0];
    const token = url.searchParams.get('token');
    const subscriptionUrl = `${baseUrl}?token=${token}`;
    const clientUrls = getClientSubscriptionUrls(baseUrl, token);
    
    const html = await generateSubscriptionPage(subscriptionUrl, clientUrls);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  } catch (error) {
    console.error('处理订阅请求失败:', error);
    return new Response('处理订阅请求失败: ' + error.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    });
  }
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