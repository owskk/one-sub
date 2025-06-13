/**
 * 聚合多个订阅源
 * @param {Array} sources - 订阅源列表
 * @returns {Promise<string>} - 聚合后的订阅内容
 */
export async function aggregateSubscriptions(sources) {
  let nodes = [];
  let successCount = 0;
  let failCount = 0;

  console.log(`开始聚合 ${sources.length} 个订阅源`);

  for (const source of sources) {
    try {
      if (source.type === 'url') {
        // 获取远程订阅内容
        console.log(`正在获取订阅: ${source.url}`);
        let response;
        try {
          // 使用AbortController实现超时
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
          
          response = await fetch(source.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: controller.signal,
            redirect: 'follow' // 自动跟随重定向
          });
          
          clearTimeout(timeoutId);
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            console.error(`获取订阅超时: ${source.url}`);
          } else {
            console.error(`获取订阅失败: ${source.url}, 错误: ${fetchError.message}`);
          }
          failCount++;
          continue;
        }
        
        if (!response.ok) {
          console.error(`获取订阅失败: ${source.url}, 状态码: ${response.status}`);
          failCount++;
          continue;
        }
        
        let content;
        try {
          content = await response.text();
        } catch (textError) {
          console.error(`读取订阅内容失败: ${source.url}, 错误: ${textError.message}`);
          failCount++;
          continue;
        }
        
        if (!content || content.trim() === '') {
          console.error(`订阅内容为空: ${source.url}`);
          failCount++;
          continue;
        }
        
        // 解析订阅内容
        try {
          // 尝试Base64解码
          let decodedContent;
          try {
            decodedContent = atob(content.trim());
          } catch (e) {
            // 如果解码失败，使用原始内容
            decodedContent = content;
          }
          
          // 处理不同格式的订阅
          if (decodedContent.startsWith('proxies:') || decodedContent.includes('- {name:')) {
            // Clash格式
            console.log(`检测到Clash格式订阅: ${source.url}`);
            // 简单提取节点，实际应该使用YAML解析器
            const lines = decodedContent.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('- {name:') || line.trim().startsWith('- name:')) {
                nodes.push(line.trim());
              }
            }
          } else {
            // 标准格式，按行分割
            const lines = decodedContent.split('\n');
            for (const line of lines) {
              if (line.trim()) {
                nodes.push(line.trim());
              }
            }
          }
          
          console.log(`成功解析订阅: ${source.url}, 获取节点数: ${nodes.length - successCount}`);
          successCount = nodes.length;
        } catch (e) {
          console.error(`解析订阅内容失败: ${source.url}, 错误: ${e.message}`);
          
          // 尝试直接按行分割原始内容
          const lines = content.split('\n');
          const startCount = nodes.length;
          for (const line of lines) {
            if (line.trim()) {
              nodes.push(line.trim());
            }
          }
          
          if (nodes.length > startCount) {
            console.log(`使用原始内容解析订阅: ${source.url}, 获取节点数: ${nodes.length - startCount}`);
            successCount += (nodes.length - startCount);
          } else {
            failCount++;
          }
        }
      } else if (source.type === 'node') {
        // 直接添加节点
        nodes.push(source.content);
        console.log(`添加直接节点: ${source.content.substring(0, 20)}...`);
        successCount++;
      }
    } catch (error) {
      console.error(`处理订阅源失败: ${error.message}`);
      failCount++;
    }
  }

  // 去重
  const originalCount = nodes.length;
  nodes = [...new Set(nodes)];
  const uniqueCount = nodes.length;
  
  console.log(`订阅聚合完成: 成功 ${successCount} 个, 失败 ${failCount} 个, 总节点 ${originalCount} 个, 去重后 ${uniqueCount} 个`);
  
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
    console.log(`开始转换订阅格式: ${targetType}`);
    
    // 检查参数
    if (!content) {
      throw new Error('订阅内容为空');
    }
    
    if (!targetType) {
      throw new Error('未指定目标格式');
    }
    
    if (!apiUrl) {
      throw new Error('未配置转换API');
    }
    
    // Base64编码内容
    const encodedContent = btoa(content);
    const url = `${apiUrl}?target=${targetType}&url=${encodeURIComponent('data:text/plain;base64,' + encodedContent)}`;
    
    console.log(`订阅转换URL: ${url}`);
    
    // 使用AbortController实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
    
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal,
        redirect: 'follow' // 自动跟随重定向
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('转换API请求超时');
      } else {
        throw new Error(`转换API请求失败: ${fetchError.message}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(`订阅转换失败，状态码: ${response.status}`);
    }
    
    let result;
    try {
      result = await response.text();
    } catch (textError) {
      throw new Error(`读取转换结果失败: ${textError.message}`);
    }
    
    if (!result || result.trim() === '') {
      throw new Error('转换结果为空');
    }
    
    console.log(`订阅转换成功: ${targetType}`);
    return result;
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