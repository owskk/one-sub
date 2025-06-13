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
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    h1, h2, h3 {
      color: #0056b3;
    }
    .container {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      background-color: #0056b3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
      margin: 5px 0;
    }
    .btn:hover {
      background-color: #004494;
    }
    input, textarea, select {
      width: 100%;
      padding: 8px;
      margin: 8px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    textarea {
      height: 150px;
      resize: vertical;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
      background-color: #fff;
    }
    .qrcode {
      text-align: center;
      margin: 20px 0;
    }
    .copy-btn {
      background-color: #28a745;
      margin-left: 10px;
    }
    .copy-btn:hover {
      background-color: #218838;
    }
    .subscription-url {
      word-break: break-all;
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .client-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 15px;
    }
    .client-item {
      flex: 1 0 200px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
  <script>
    function copyToClipboard(text, btnId) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(btnId);
        const originalText = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      });
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
      return `
        <div class="card">
          <h3>订阅源 ${index + 1}</h3>
          <p>类型: 订阅链接</p>
          <p>URL: ${source.url}</p>
          <p>
            <button class="btn" onclick="deleteSource(${index})">删除</button>
          </p>
        </div>
      `;
    } else if (source.type === 'node') {
      return `
        <div class="card">
          <h3>订阅源 ${index + 1}</h3>
          <p>类型: 直接节点</p>
          <p>内容: ${source.content}</p>
          <p>
            <button class="btn" onclick="deleteSource(${index})">删除</button>
          </p>
        </div>
      `;
    }
    return '';
  }).join('');

  return generateHtml('订阅管理', `
    <h1>订阅管理</h1>
    
    <h2>添加订阅源</h2>
    <div class="card">
      <h3>添加订阅链接</h3>
      <input type="text" id="subscriptionUrl" placeholder="订阅链接URL">
      <button class="btn" onclick="addSubscriptionUrl()">添加</button>
      
      <h3>添加直接节点</h3>
      <textarea id="nodeContent" placeholder="节点内容"></textarea>
      <button class="btn" onclick="addNodeContent()">添加</button>
    </div>
    
    <h2>现有订阅源</h2>
    <div id="sourcesList">
      ${sourcesList}
    </div>
    
    <script>
      function addSubscriptionUrl() {
        const url = document.getElementById('subscriptionUrl').value.trim();
        if (!url) {
          alert('请输入有效的订阅链接');
          return;
        }
        
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
          if (data.success) {
            alert('添加成功');
            location.reload();
          } else {
            alert('添加失败: ' + data.error);
          }
        })
        .catch(error => {
          alert('请求失败: ' + error);
        });
      }
      
      function addNodeContent() {
        const content = document.getElementById('nodeContent').value.trim();
        if (!content) {
          alert('请输入节点内容');
          return;
        }
        
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
          if (data.success) {
            alert('添加成功');
            location.reload();
          } else {
            alert('添加失败: ' + data.error);
          }
        })
        .catch(error => {
          alert('请求失败: ' + error);
        });
      }
      
      function deleteSource(index) {
        if (confirm('确定要删除这个订阅源吗？')) {
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
            if (data.success) {
              alert('删除成功');
              location.reload();
            } else {
              alert('删除失败: ' + data.error);
            }
          })
          .catch(error => {
            alert('请求失败: ' + error);
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
  const qrCodeDataUrl = await QRCode.toDataURL(subscriptionUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 200
  });
  
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
    
    <h2>通用订阅链接</h2>
    <div class="subscription-url">${subscriptionUrl}</div>
    <button id="copy-main" class="btn copy-btn" onclick="copyToClipboard('${subscriptionUrl}', 'copy-main')">复制链接</button>
    
    <div class="qrcode">
      <h2>订阅二维码</h2>
      <img src="${qrCodeDataUrl}" alt="订阅二维码">
    </div>
    
    <h2>客户端订阅链接</h2>
    <div class="client-list">
      ${clientItems}
    </div>
  `);
} 