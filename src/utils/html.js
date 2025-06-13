import QRCode from 'qrcode';

/**
 * 生成HTML页面
 * @param {string} title - 页面标题
 * @param {string} content - 页面内容
 * @returns {string} - 完整的HTML页面
 */
export function generateHtml(title, content) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --primary-color: #1e88e5;
      --primary-dark: #1565c0;
      --success-color: #43a047;
      --success-dark: #2e7d32;
      --danger-color: #e53935;
      --danger-dark: #c62828;
      --text-color: #333;
      --bg-color: #f5f7fa;
      --card-bg: #fff;
      --border-color: #e0e0e0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--bg-color);
    }
    
    h1, h2, h3 {
      color: var(--primary-color);
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 2rem;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .container {
      background-color: var(--card-bg);
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .btn {
      display: inline-block;
      padding: 10px 18px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
      margin: 5px 0;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    
    .btn:hover {
      background-color: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    input, textarea, select {
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
      transition: border 0.2s ease;
    }
    
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.2);
    }
    
    textarea {
      height: 150px;
      resize: vertical;
    }
    
    .card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background-color: var(--card-bg);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
    
    .qrcode {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .qrcode img {
      max-width: 200px;
      height: auto;
    }
    
    .copy-btn {
      background-color: var(--success-color);
      margin-left: 10px;
    }
    
    .copy-btn:hover {
      background-color: var(--success-dark);
    }
    
    .subscription-url {
      word-break: break-all;
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      font-family: monospace;
      font-size: 14px;
      margin: 10px 0;
    }
    
    .client-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .client-item {
      padding: 15px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--card-bg);
      transition: transform 0.2s ease;
    }
    
    .client-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    }
    
    .client-item h3 {
      margin-top: 0;
      color: var(--primary-color);
      font-size: 1.2rem;
    }
    
    .tabs {
      display: flex;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .tab {
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .tab:hover {
      color: var(--primary-color);
    }
    
    .tab.active {
      border-bottom: 3px solid var(--primary-color);
      color: var(--primary-color);
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .notification {
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 6px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .notification.success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid #43a047;
    }
    
    .notification.error {
      background-color: #ffebee;
      color: #c62828;
      border-left: 4px solid #e53935;
    }
    
    .notification.info {
      background-color: #e3f2fd;
      color: #1565c0;
      border-left: 4px solid #1e88e5;
    }
    
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: white;
      margin-top: 15px;
      font-weight: 500;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    
    .btn.primary {
      background-color: var(--success-color);
    }
    
    .btn.primary:hover {
      background-color: var(--success-dark);
    }
    
    .btn.danger {
      background-color: var(--danger-color);
    }
    
    .btn.danger:hover {
      background-color: var(--danger-dark);
    }
    
    .empty-message {
      text-align: center;
      padding: 30px;
      color: #757575;
      font-style: italic;
    }
    
    .count {
      font-size: 0.9rem;
      color: #757575;
      font-weight: normal;
    }
    
    .login-form {
      max-width: 500px;
      margin: 30px auto;
      padding: 25px;
    }
    
    .login-form h3 {
      margin-top: 0;
      text-align: center;
    }
    
    .login-form .btn {
      width: 100%;
      margin-top: 15px;
      padding: 12px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
      
      .client-list {
        grid-template-columns: 1fr;
      }
      
      h1 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
  <script>
    function copyToClipboard(text, btnId) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        const btn = document.getElementById(btnId);
        const originalText = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      }
      
      document.body.removeChild(textArea);
    }
  </script>
</body>
</html>
  `;
}

/**
 * 生成订阅管理页面
 * @param {Object} subscriptions - 订阅数据
 * @param {string} adminUrl - 管理员URL
 * @returns {string} - 订阅管理页面HTML
 */
export function generateAdminPage(subscriptions, adminUrl) {
  const sourcesList = subscriptions.sources.map((source, index) => {
    if (source.type === 'url') {
      const escapedUrl = source.url.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      return `
        <div class="card">
          <h3>订阅源 ${index + 1}</h3>
          <p>类型: 订阅链接</p>
          <p>URL: <span class="subscription-url">${source.url}</span></p>
          ${source.addedAt ? `<p>添加时间: ${new Date(source.addedAt).toLocaleString()}</p>` : ''}
          <p>
            <button class="btn" onclick="testSource('url', '${escapedUrl}')">测试</button>
            <button class="btn danger" onclick="deleteSource(${index})">删除</button>
          </p>
        </div>
      `;
    } else if (source.type === 'node') {
      return `
        <div class="card">
          <h3>订阅源 ${index + 1}</h3>
          <p>类型: 直接节点</p>
          <p>内容: <span class="subscription-url">${source.content}</span></p>
          ${source.addedAt ? `<p>添加时间: ${new Date(source.addedAt).toLocaleString()}</p>` : ''}
          <p>
            <button class="btn danger" onclick="deleteSource(${index})">删除</button>
          </p>
        </div>
      `;
    }
    return '';
  }).join('');

  return generateHtml('订阅管理', `
    <h1>订阅管理</h1>
    
    <div id="notification" class="notification" style="display: none;"></div>
    
    <h2>添加订阅源</h2>
    <div class="tabs">
      <div class="tab active" onclick="switchTab('url')">订阅链接</div>
      <div class="tab" onclick="switchTab('node')">直接节点</div>
    </div>
    
    <div id="url-tab" class="tab-content active card">
      <h3>添加订阅链接</h3>
      <input type="text" id="subscriptionUrl" placeholder="订阅链接URL">
      <div class="button-group">
        <button class="btn" onclick="testSubscriptionUrl()">测试</button>
        <button class="btn primary" onclick="addSubscriptionUrl()">添加</button>
      </div>
    </div>
    
    <div id="node-tab" class="tab-content card">
      <h3>添加直接节点</h3>
      <textarea id="nodeContent" placeholder="节点内容"></textarea>
      <button class="btn primary" onclick="addNodeContent()">添加</button>
    </div>
    
    <h2>现有订阅源 <span class="count">(${subscriptions.sources.length})</span></h2>
    <div id="sourcesList">
      ${sourcesList.length > 0 ? sourcesList : '<p class="empty-message">暂无订阅源，请添加</p>'}
    </div>
    
    <div id="loading-overlay" class="loading-overlay" style="display: none;">
      <div class="spinner"></div>
      <div class="loading-text">处理中...</div>
    </div>
    
    <script>
      function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        setTimeout(() => {
          notification.style.display = 'none';
        }, 5000);
      }
      
      function showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
      }
      
      function hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
      }
      
      function switchTab(tabName) {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 取消所有标签的激活状态
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 激活选中的标签和内容
        document.getElementById(tabName + '-tab').classList.add('active');
        document.querySelector('.tab[onclick="switchTab(\\'' + tabName + '\\')"]').classList.add('active');
      }
      
      function testSubscriptionUrl() {
        const url = document.getElementById('subscriptionUrl').value.trim();
        if (!url) {
          showNotification('请输入有效的订阅链接', 'error');
          return;
        }
        
        showLoading();
        
        fetch('${adminUrl}&action=testSource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'url',
            url: url
          })
        })
        .then(response => response.json())
        .then(data => {
          hideLoading();
          if (data.success) {
            showNotification('测试成功，共有 ' + data.nodeCount + ' 个节点', 'success');
          } else {
            showNotification('测试失败: ' + data.error, 'error');
          }
        })
        .catch(error => {
          hideLoading();
          showNotification('请求失败: ' + error, 'error');
        });
      }
      
      function testSource(type, url) {
        if (type !== 'url') {
          showNotification('只能测试URL类型的订阅源', 'error');
          return;
        }
        
        showLoading();
        
        fetch('${adminUrl}&action=testSource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'url',
            url: url
          })
        })
        .then(response => response.json())
        .then(data => {
          hideLoading();
          if (data.success) {
            showNotification('测试成功，共有 ' + data.nodeCount + ' 个节点', 'success');
          } else {
            showNotification('测试失败: ' + data.error, 'error');
          }
        })
        .catch(error => {
          hideLoading();
          showNotification('请求失败: ' + error, 'error');
        });
      }
      
      function addSubscriptionUrl() {
        const url = document.getElementById('subscriptionUrl').value.trim();
        if (!url) {
          showNotification('请输入有效的订阅链接', 'error');
          return;
        }
        
        showLoading();
        
        fetch('${adminUrl}&action=addSource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'url',
            url: url
          })
        })
        .then(response => response.json())
        .then(data => {
          hideLoading();
          if (data.success) {
            showNotification('添加成功', 'success');
            location.reload();
          } else {
            showNotification('添加失败: ' + data.error, 'error');
          }
        })
        .catch(error => {
          hideLoading();
          showNotification('请求失败: ' + error, 'error');
        });
      }
      
      function addNodeContent() {
        const content = document.getElementById('nodeContent').value.trim();
        if (!content) {
          showNotification('请输入节点内容', 'error');
          return;
        }
        
        showLoading();
        
        fetch('${adminUrl}&action=addSource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'node',
            content: content
          })
        })
        .then(response => response.json())
        .then(data => {
          hideLoading();
          if (data.success) {
            showNotification('添加成功', 'success');
            location.reload();
          } else {
            showNotification('添加失败: ' + data.error, 'error');
          }
        })
        .catch(error => {
          hideLoading();
          showNotification('请求失败: ' + error, 'error');
        });
      }
      
      function deleteSource(index) {
        if (confirm('确定要删除这个订阅源吗？')) {
          showLoading();
          
          fetch('${adminUrl}&action=deleteSource', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              index: index
            })
          })
          .then(response => response.json())
          .then(data => {
            hideLoading();
            if (data.success) {
              showNotification('删除成功', 'success');
              location.reload();
            } else {
              showNotification('删除失败: ' + data.error, 'error');
            }
          })
          .catch(error => {
            hideLoading();
            showNotification('请求失败: ' + error, 'error');
          });
        }
      }
    </script>
  `);
}

/**
 * 生成订阅查看页面
 * @param {string} subscriptionUrl - 订阅链接
 * @param {Object} clientUrls - 客户端订阅链接
 * @returns {Promise<string>} - 订阅查看页面HTML
 */
export async function generateSubscriptionPage(subscriptionUrl, clientUrls) {
  // 生成订阅二维码
  let qrCodeDataUrl;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(subscriptionUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    qrCodeDataUrl = ''; // 如果生成失败，使用空字符串
  }
  
  const clientItems = Object.entries(clientUrls).map(([client, url]) => {
    const btnId = `copy-${client}`;
    return `
      <div class="client-item">
        <h3>${client.charAt(0).toUpperCase() + client.slice(1)}</h3>
        <div class="subscription-url">${url}</div>
        <button id="${btnId}" class="btn copy-btn" onclick="copyToClipboard('${url}', '${btnId}')">复制链接</button>
      </div>
    `;
  }).join('');
  
  return generateHtml('订阅信息', `
    <h1>订阅信息</h1>
    
    <div class="card">
      <h2>通用订阅链接</h2>
      <div class="subscription-url">${subscriptionUrl}</div>
      <button id="copy-main" class="btn copy-btn" onclick="copyToClipboard('${subscriptionUrl}', 'copy-main')">复制链接</button>
    </div>
    
    ${qrCodeDataUrl ? `
    <div class="qrcode">
      <h2>订阅二维码</h2>
      <img src="${qrCodeDataUrl}" alt="订阅二维码">
    </div>
    ` : ''}
    
    <h2>客户端订阅链接</h2>
    <div class="client-list">
      ${clientItems}
    </div>
    
    <p style="text-align: center; margin-top: 30px;">
      <a href="/" class="btn">返回首页</a>
    </p>
  `);
} 