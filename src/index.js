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

// 常用配置文件列表
const COMMON_CONFIGS = [
  { name: '不使用配置', value: '' },
  { name: 'ACL4SSR 精简版', value: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/config/ACL4SSR_Mini.ini' },
  { name: 'ACL4SSR 标准版', value: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/config/ACL4SSR_Online.ini' },
  { name: 'ACL4SSR 多国家地区', value: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/config/ACL4SSR_Online_MultiCountry.ini' },
  { name: 'ACL4SSR 全分组', value: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/config/ACL4SSR_Online_Full.ini' },
  { name: 'ACL4SSR 全分组 多模式', value: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/config/ACL4SSR_Online_Full_MultiMode.ini' }
];

// Nginx默认欢迎页面
const NGINX_DEFAULT_PAGE = `<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>`;

/**
 * 处理请求
 */
async function handleRequest(request, env) {
  // 从环境变量获取访问令牌
  const ACCESS_TOKEN = env && env.ACCESS_TOKEN ? env.ACCESS_TOKEN : '';
  
  const url = new URL(request.url);
  const path = url.pathname;
  const params = url.searchParams;
  const token = params.get('token');
  
  // 检查路径中是否包含token
  const pathParts = path.split('/').filter(part => part);
  const pathToken = pathParts.length > 0 ? pathParts[0] : null;
  
  // 如果是根路径，返回Nginx默认页面
  if (path === '/' || path === '') {
    // 如果有查询参数token并且token正确，显示转换工具
    if (token && ACCESS_TOKEN && token === ACCESS_TOKEN) {
      return new Response(generateHtmlContent(ACCESS_TOKEN), {
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
        },
      });
    }
    // 否则显示Nginx默认页面
    return new Response(NGINX_DEFAULT_PAGE, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Server': 'nginx/1.18.0 (Ubuntu)'
      },
    });
  }
  
  // 如果路径是/token格式，并且token正确，显示转换工具
  if (pathToken && ACCESS_TOKEN && pathToken === ACCESS_TOKEN) {
    return new Response(generateHtmlContent(ACCESS_TOKEN), {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
  }
  
  // 如果路径以token开头，后面跟着/sub，处理订阅转换请求
  if (pathParts.length >= 2 && pathParts[0] === ACCESS_TOKEN && pathParts[1] === 'sub') {
    // 获取参数
    const target = params.get('target');
    const subUrl = params.get('url');
    const config = params.get('config');
    const backendUrlParam = params.get('backend');
    
    // 验证必要参数
    if (!target || !subUrl) {
      return new Response('缺少必要参数: target 和 url 是必须的', { status: 400 });
    }
    
    // 验证目标格式
    if (!ALLOWED_TARGETS.includes(target) && !target.startsWith('surge&ver=')) {
      return new Response('不支持的目标格式', { status: 400 });
    }
    
    // 确定后端URL
    const backendBaseUrl = backendUrlParam || DEFAULT_BACKEND;
    
    // 构建后端请求URL
    const backendUrl = new URL('/sub', backendBaseUrl);
    
    // 复制所有参数，但排除backend和token
    for (const [key, value] of params.entries()) {
      if (key !== 'backend' && key !== 'token') {
        backendUrl.searchParams.append(key, value);
      }
    }
    
    try {
      // 发送请求到后端
      const response = await fetch(backendUrl.toString(), {
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'SubConverter-Worker',
        },
      });
      
      // 如果后端返回错误
      if (!response.ok) {
        return new Response(`后端服务错误: ${response.status} ${response.statusText}`, { 
          status: response.status 
        });
      }
      
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
  
  // 处理常规的/sub请求（带token参数）
  if (path === '/sub') {
    // 获取参数
    const target = params.get('target');
    const subUrl = params.get('url');
    const config = params.get('config');
    const reqToken = params.get('token');
    const backendUrlParam = params.get('backend');
    
    // 如果设置了访问令牌，则验证令牌
    if (ACCESS_TOKEN && reqToken !== ACCESS_TOKEN) {
      return new Response('访问令牌无效或缺失', { status: 403 });
    }
    
    // 验证必要参数
    if (!target || !subUrl) {
      return new Response('缺少必要参数: target 和 url 是必须的', { status: 400 });
    }
    
    // 验证目标格式
    if (!ALLOWED_TARGETS.includes(target) && !target.startsWith('surge&ver=')) {
      return new Response('不支持的目标格式', { status: 400 });
    }
    
    // 确定后端URL
    const backendBaseUrl = backendUrlParam || DEFAULT_BACKEND;
    
    // 构建后端请求URL
    const backendUrl = new URL('/sub', backendBaseUrl);
    
    // 复制所有参数，但排除backend和token
    for (const [key, value] of params.entries()) {
      if (key !== 'backend' && key !== 'token') {
        backendUrl.searchParams.append(key, value);
      }
    }
    
    try {
      // 发送请求到后端
      const response = await fetch(backendUrl.toString(), {
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'SubConverter-Worker',
        },
      });
      
      // 如果后端返回错误
      if (!response.ok) {
        return new Response(`后端服务错误: ${response.status} ${response.statusText}`, { 
          status: response.status 
        });
      }
      
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
  
  // 其他路径返回404，但伪装成Nginx 404页面
  return new Response('<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx/1.18.0 (Ubuntu)</center>\r\n</body>\r\n</html>', { 
    status: 404,
    headers: {
      'Content-Type': 'text/html',
      'Server': 'nginx/1.18.0 (Ubuntu)'
    }
  });
}

// HTML页面内容生成函数
function generateHtmlContent(accessToken) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>订阅转换工具</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 20px;
      line-height: 1.6;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    .form-label {
      font-weight: 500;
    }
    .form-text {
      color: #6c757d;
      font-size: 0.875rem;
    }
    .btn-primary {
      background-color: #4CAF50;
      border-color: #4CAF50;
    }
    .btn-primary:hover {
      background-color: #45a049;
      border-color: #45a049;
    }
    .btn-copy {
      background-color: #2196F3;
      border-color: #2196F3;
    }
    .btn-copy:hover {
      background-color: #0b7dda;
      border-color: #0b7dda;
    }
    .result-card {
      margin-top: 30px;
      border: 1px solid rgba(0, 0, 0, 0.125);
      border-radius: 0.25rem;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .result-url {
      word-break: break-all;
      background-color: #f1f1f1;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .advanced-options {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 0.875rem;
      color: #6c757d;
    }
    .token-input {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>订阅转换工具</h1>
    
    <div id="converter-form">
      <div class="mb-3">
        <label for="subUrl" class="form-label">订阅链接</label>
        <input type="text" class="form-control" id="subUrl" placeholder="请输入原始订阅链接，多个链接请用|分隔">
        <div class="form-text">支持多种订阅格式，多个订阅请用 | 分隔</div>
      </div>
      
      <div class="mb-3">
        <label for="target" class="form-label">目标格式</label>
        <select class="form-select" id="target">
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
      
      <div class="mb-3">
        <label for="config" class="form-label">配置文件</label>
        <select class="form-select" id="configSelect">
          <!-- 将通过JavaScript填充 -->
        </select>
      </div>
      
      <div class="mb-3">
        <label for="customConfig" class="form-label">自定义配置链接</label>
        <input type="text" class="form-control" id="customConfig" placeholder="可选，自定义配置文件链接">
      </div>
      
      <div class="mb-3">
        <label for="backendUrl" class="form-label">后端服务地址</label>
        <input type="text" class="form-control" id="backendUrl" placeholder="可选，自定义后端服务地址">
        <div class="form-text">留空则使用默认后端</div>
      </div>
      
      <div class="form-check mb-2">
        <input class="form-check-input" type="checkbox" id="emoji" checked>
        <label class="form-check-label" for="emoji">启用 Emoji</label>
      </div>
      
      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" id="newName" checked>
        <label class="form-check-label" for="newName">使用新命名</label>
      </div>
      
      <div class="d-grid">
        <button id="convertBtn" class="btn btn-primary">生成订阅链接</button>
      </div>
      
      <div id="result" class="result-card" style="display: none;">
        <h5>转换结果</h5>
        <div id="resultUrl" class="result-url"></div>
        <div class="d-grid">
          <button id="copyBtn" class="btn btn-copy">复制链接</button>
        </div>
        <div class="mt-3 alert alert-info">
          <strong>使用说明：</strong>
          <p>1. 生成的链接可直接添加到代理客户端中作为订阅链接</p>
          <p>2. 链接会直接返回转换后的订阅内容，无需再次访问网页</p>
          <p>3. 如果您的客户端无法正常使用，请尝试不同的目标格式</p>
        </div>
      </div>
      
      <div class="footer">
        <p>基于 <a href="https://github.com/tindy2013/subconverter" target="_blank">subconverter</a> 提供的后端服务</p>
      </div>
    </div>
  </div>

  <script>
    // 常用配置文件列表
    const commonConfigs = ${JSON.stringify(COMMON_CONFIGS)};
    
    // 默认后端
    const defaultBackend = '${DEFAULT_BACKEND}';
    
    // 获取当前路径（用于生成链接）
    const currentPath = window.location.pathname;
    
    // 初始化页面
    document.addEventListener('DOMContentLoaded', function() {
      // 填充配置文件下拉列表
      const configSelect = document.getElementById('configSelect');
      commonConfigs.forEach(config => {
        const option = document.createElement('option');
        option.value = config.value;
        option.textContent = config.name;
        configSelect.appendChild(option);
      });
      
      // 设置默认后端
      document.getElementById('backendUrl').placeholder = '默认: ' + defaultBackend;
      
      // 配置文件选择逻辑
      document.getElementById('configSelect').addEventListener('change', function() {
        const customConfigInput = document.getElementById('customConfig');
        if (this.value) {
          customConfigInput.value = this.value;
        } else {
          customConfigInput.value = '';
        }
      });
      
      // 生成订阅链接
      document.getElementById('convertBtn').addEventListener('click', function() {
        const subUrl = document.getElementById('subUrl').value.trim();
        if (!subUrl) {
          alert('请输入订阅链接');
          return;
        }
        
        const target = document.getElementById('target').value;
        const config = document.getElementById('customConfig').value.trim();
        const backendUrl = document.getElementById('backendUrl').value.trim() || defaultBackend;
        const emoji = document.getElementById('emoji').checked;
        const newName = document.getElementById('newName').checked;
        
        // 构建转换URL - 修复直接访问订阅内容而非页面的问题
        let origin = window.location.origin;
        
        // 提取当前路径中的token (如果是/token格式访问的)
        const pathParts = currentPath.split('/').filter(part => part);
        const pathToken = pathParts.length > 0 ? pathParts[0] : '';
        
        // 构建正确的订阅URL
        let convertUrl = origin + '/' + pathToken + '/sub?target=' + encodeURIComponent(target) + '&url=' + encodeURIComponent(subUrl);
        
        if (config) {
          convertUrl += '&config=' + encodeURIComponent(config);
        }
        
        if (emoji) {
          convertUrl += '&emoji=true';
        }
        
        if (newName) {
          convertUrl += '&new_name=true';
        }
        
        if (backendUrl !== defaultBackend) {
          convertUrl += '&backend=' + encodeURIComponent(backendUrl);
        }
        
        document.getElementById('resultUrl').textContent = convertUrl;
        document.getElementById('result').style.display = 'block';
      });
      
      // 复制链接
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
    });
  </script>
</body>
</html>`;
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
      'Server': 'nginx/1.18.0 (Ubuntu)'
    },
  });
}

/**
 * 处理所有请求
 */
export default {
  async fetch(request, env, ctx) {
    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // 处理GET请求
    if (request.method === 'GET') {
      return handleRequest(request, env);
    }
    
    // 其他请求方法不支持，返回伪装的Nginx错误页面
    return new Response('<html>\r\n<head><title>405 Method Not Allowed</title></head>\r\n<body>\r\n<center><h1>405 Method Not Allowed</h1></center>\r\n<hr><center>nginx/1.18.0 (Ubuntu)</center>\r\n</body>\r\n</html>', { 
      status: 405,
      headers: {
        'Content-Type': 'text/html',
        'Server': 'nginx/1.18.0 (Ubuntu)'
      }
    });
  }
}; 