/**
 * 订阅转换 Cloudflare Worker
 * 基于subconverter的订阅转换代理
 */

// 配置默认后端
const DEFAULT_BACKEND = 'https://api.v1.mk';

// 允许的目标格式
const ALLOWED_TARGETS = [
  'clash', 'clashr', 'quan', 'quanx', 'loon', 'ss', 'sssub',
  'ssr', 'ssd', 'surfboard', 'v2ray',
  'surge', 'surge&ver=2', 'surge&ver=3', 'surge&ver=4'
];

// HTML页面内容
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅转换</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="text"], select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .checkbox-group {
      margin-top: 10px;
    }
    .button-group {
      margin-top: 20px;
      text-align: center;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #45a049;
    }
    .result {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    .copy-btn {
      background-color: #2196F3;
      margin-top: 10px;
    }
    .copy-btn:hover {
      background-color: #0b7dda;
    }
  </style>
</head>
<body>
  <h1>订阅转换工具</h1>
  
  <div class="form-group">
    <label for="subUrl">订阅链接：</label>
    <input type="text" id="subUrl" placeholder="请输入原始订阅链接，多个链接请用|分隔">
  </div>
  
  <div class="form-group">
    <label for="target">目标格式：</label>
    <select id="target">
      <option value="clash">Clash</option>
      <option value="clashr">ClashR</option>
      <option value="quan">Quantumult</option>
      <option value="quanx">Quantumult X</option>
      <option value="loon">Loon</option>
      <option value="ss">SS (SIP002)</option>
      <option value="sssub">SS Android</option>
      <option value="ssr">SSR</option>
      <option value="ssd">SSD</option>
      <option value="surfboard">Surfboard</option>
      <option value="surge&ver=4">Surge 4</option>
      <option value="surge&ver=3">Surge 3</option>
      <option value="surge&ver=2">Surge 2</option>
      <option value="v2ray">V2Ray</option>
    </select>
  </div>
  
  <div class="form-group">
    <label for="config">配置文件：</label>
    <input type="text" id="config" placeholder="可选，配置文件链接">
  </div>
  
  <div class="checkbox-group">
    <input type="checkbox" id="emoji" checked>
    <label for="emoji" style="display: inline;">启用 Emoji</label>
  </div>
  
  <div class="checkbox-group">
    <input type="checkbox" id="newName" checked>
    <label for="newName" style="display: inline;">使用新命名</label>
  </div>
  
  <div class="button-group">
    <button id="convertBtn">生成订阅链接</button>
  </div>
  
  <div class="result" id="result" style="display: none;">
    <h3>转换结果：</h3>
    <p id="resultUrl"></p>
    <button class="copy-btn" id="copyBtn">复制链接</button>
  </div>

  <script>
    document.getElementById('convertBtn').addEventListener('click', function() {
      const subUrl = encodeURIComponent(document.getElementById('subUrl').value.trim());
      const target = document.getElementById('target').value;
      const config = encodeURIComponent(document.getElementById('config').value.trim());
      const emoji = document.getElementById('emoji').checked;
      const newName = document.getElementById('newName').checked;
      
      if (!subUrl) {
        alert('请输入订阅链接');
        return;
      }
      
      // 构建转换URL
      let convertUrl = \`\${window.location.origin}/sub?target=\${target}&url=\${subUrl}\`;
      
      if (config) {
        convertUrl += \`&config=\${config}\`;
      }
      
      if (emoji) {
        convertUrl += '&emoji=true';
      }
      
      if (newName) {
        convertUrl += '&new_name=true';
      }
      
      document.getElementById('resultUrl').textContent = convertUrl;
      document.getElementById('result').style.display = 'block';
    });
    
    document.getElementById('copyBtn').addEventListener('click', function() {
      const resultUrl = document.getElementById('resultUrl').textContent;
      
      navigator.clipboard.writeText(resultUrl).then(function() {
        alert('链接已复制到剪贴板');
      }, function(err) {
        console.error('复制失败: ', err);
        
        // 备用复制方法
        const textarea = document.createElement('textarea');
        textarea.value = resultUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('链接已复制到剪贴板');
      });
    });
  </script>
</body>
</html>`;

/**
 * 处理请求
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 如果是根路径，返回HTML页面
  if (path === '/' || path === '') {
    return new Response(HTML_CONTENT, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
  }
  
  // 如果是订阅转换请求
  if (path === '/sub') {
    const params = url.searchParams;
    
    // 获取参数
    const target = params.get('target');
    const subUrl = params.get('url');
    const config = params.get('config');
    
    // 验证必要参数
    if (!target || !subUrl) {
      return new Response('缺少必要参数: target 和 url 是必须的', { status: 400 });
    }
    
    // 验证目标格式
    if (!ALLOWED_TARGETS.includes(target) && !target.startsWith('surge&ver=')) {
      return new Response('不支持的目标格式', { status: 400 });
    }
    
    // 构建后端请求URL
    const backendUrl = new URL('/sub', DEFAULT_BACKEND);
    
    // 复制所有参数
    for (const [key, value] of params.entries()) {
      backendUrl.searchParams.append(key, value);
    }
    
    try {
      // 发送请求到后端
      const response = await fetch(backendUrl.toString(), {
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'SubConverter-Worker',
        },
      });
      
      // 获取原始响应
      const originalResponse = new Response(response.body, response);
      
      // 创建新的响应对象，添加自定义头
      const newResponse = new Response(originalResponse.body, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: originalResponse.headers,
      });
      
      // 添加CORS头
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // 添加缓存控制
      newResponse.headers.set('Cache-Control', 'public, max-age=600');
      
      return newResponse;
    } catch (error) {
      return new Response(`请求处理错误: ${error.message}`, { status: 500 });
    }
  }
  
  // 其他路径返回404
  return new Response('页面不存在', { status: 404 });
}

/**
 * 处理OPTIONS请求
 */
function handleOptions(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * 处理所有请求
 */
addEventListener('fetch', event => {
  const request = event.request;
  
  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    event.respondWith(handleOptions(request));
    return;
  }
  
  // 处理GET请求
  if (request.method === 'GET') {
    event.respondWith(handleRequest(request));
    return;
  }
  
  // 其他请求方法不支持
  event.respondWith(
    new Response('不支持的请求方法', { status: 405 })
  );
}); 