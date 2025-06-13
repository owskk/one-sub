# Atlas-Sub

一个基于Cloudflare Workers的订阅转换和聚合服务。

## 功能特点

- **订阅聚合**：汇总多个订阅源（包括直接节点链接和订阅链接）
- **订阅转换**：使用在线订阅转换后端进行格式转换
- **访问控制**：支持管理员令牌和访客令牌
- **KV存储**：使用Cloudflare KV存储订阅数据
- **Web界面**：提供管理和查看订阅的Web界面

## 部署指南

### 前提条件

- Cloudflare账号
- Node.js和npm

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/atlas-sub.git
   cd atlas-sub
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建KV命名空间
   ```bash
   npx wrangler kv:namespace create SUBSCRIPTIONS
   npx wrangler kv:namespace create SUBSCRIPTIONS --preview
   ```

4. 更新`wrangler.toml`文件
   - 将创建的KV命名空间ID填入`wrangler.toml`文件中
   - 修改`ADMIN_TOKEN`和`VISITOR_TOKEN`为你自己的安全令牌

5. 部署到Cloudflare Workers
   ```bash
   npx wrangler deploy
   ```

## 使用说明

### 管理员功能

- 访问`https://your-worker-url.workers.dev/sub?token=admin_token`
- 添加和管理订阅源
- 查看订阅链接和二维码

### 访客功能

- 访问`https://your-worker-url.workers.dev/sub?token=visitor_token`
- 查看订阅链接和二维码
- 获取各种客户端的订阅地址

## 支持的客户端格式

- Clash
- Shadowrocket
- Quantumult
- QuantumultX
- Surge
- Loon
- Surfboard
- V2Ray

## 开发

### 本地开发

```bash
npx wrangler dev
```

### 测试

访问`http://localhost:8787`进行本地测试。

## 注意事项

- 请确保修改默认的`ADMIN_TOKEN`和`VISITOR_TOKEN`，以防止未授权访问
- Cloudflare Workers免费版每天有10万次请求限制
- KV存储有读写操作限制，请参考Cloudflare官方文档

## 许可证

MIT 