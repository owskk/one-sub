/**
 * 聚合多个订阅源
 * @param {Array} sources - 订阅源列表
 * @returns {Promise<string>} - 聚合后的订阅内容
 */
export async function aggregateSubscriptions(sources) {
  let nodes = [];

  for (const source of sources) {
    try {
      if (source.type === 'url') {
        // 获取远程订阅内容
        const response = await fetch(source.url);
        if (!response.ok) {
          console.error(`获取订阅失败: ${source.url}, 状态码: ${response.status}`);
          continue;
        }
        
        const content = await response.text();
        // 解析订阅内容（这里假设是base64编码的）
        try {
          const decodedContent = atob(content.trim());
          const lines = decodedContent.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              nodes.push(line);
            }
          }
        } catch (e) {
          // 如果不是base64编码，直接按行分割
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              nodes.push(line);
            }
          }
        }
      } else if (source.type === 'node') {
        // 直接添加节点
        nodes.push(source.content);
      }
    } catch (error) {
      console.error(`处理订阅源失败: ${error.message}`);
    }
  }

  // 去重
  nodes = [...new Set(nodes)];
  return nodes.join('\n');
}

/**
 * 转换订阅格式
 * @param {string} content - 订阅内容
 * @param {string} targetType - 目标格式
 * @param {string} apiUrl - 转换API地址
 * @returns {Promise<string>} - 转换后的订阅内容
 */
export async function convertSubscription(content, targetType, apiUrl) {
  try {
    const encodedContent = btoa(content);
    const url = `${apiUrl}?target=${targetType}&url=${encodeURIComponent(encodedContent)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`订阅转换失败，状态码: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`订阅转换失败: ${error.message}`);
    throw error;
  }
}

/**
 * 获取客户端订阅链接
 * @param {string} baseUrl - 基础URL
 * @param {string} token - 访问令牌
 * @returns {Object} - 各客户端的订阅链接
 */
export function getClientSubscriptionUrls(baseUrl, token) {
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  
  const base = url.toString();
  
  return {
    clash: `${base}&format=clash`,
    shadowrocket: `${base}&format=ss`,
    quantumult: `${base}&format=quan`,
    quantumultX: `${base}&format=quanx`,
    surge: `${base}&format=surge`,
    loon: `${base}&format=loon`,
    surfboard: `${base}&format=surfboard`,
    v2ray: `${base}&format=v2ray`
  };
} 