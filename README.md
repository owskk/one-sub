# 订阅转换 Cloudflare Worker

这是一个基于 Cloudflare Worker 的订阅转换工具，可以将各种代理订阅格式相互转换。

## 功能特点

- 支持多种订阅格式转换
- 简单易用的 Web 界面
- 低延迟，全球加速
- 无需服务器，零成本部署
- 支持自定义后端和配置文件
- 支持访问令牌验证，保护您的服务

## 支持的订阅格式

### 作为源格式

- Clash
- ClashR
- Quantumult
- Quantumult X
- Loon
- SS (SIP002)
- SS Android
- SSD
- SSR
- Surfboard
- Surge 2/3/4
- V2Ray
- Telegram HTTP/Socks5 链接

### 作为目标格式

- Clash
- ClashR
- Quantumult
- Quantumult X
- Loon
- SS (SIP002)
- SS Android
- SSD
- SSR
- Surfboard
- Surge 2/3/4
- V2Ray

## 部署方法

### 准备工作

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
2. 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

```bash
npm install -g wrangler
```

### 部署步骤

1. 登录 Wrangler

```bash
wrangler login
```

2. 设置访问令牌（可选）

编辑 `wrangler.toml` 文件，在 `[vars]` 部分设置 `ACCESS_TOKEN`：

```toml
[vars]
ACCESS_TOKEN = "your-secret-token"
```

如果不想启用令牌验证，保持 `ACCESS_TOKEN = ""` 即可。

3. 发布 Worker

```bash
wrangler publish
```

4. 访问分配的域名（例如：https://one-sub.your-name.workers.dev）

## 使用方法

### Web 界面

直接访问 Worker 域名，使用 Web 界面生成转换链接。

如果启用了访问令牌验证，需要先输入正确的令牌才能使用服务。

### 自定义设置

- **后端服务地址**：可以设置自定义的 subconverter 后端服务地址
- **配置文件**：提供了多种常用配置文件，也可以使用自定义配置链接

### API 接口

```
https://your-worker-domain.workers.dev/sub?target=clash&url=订阅链接&config=配置文件链接
```

#### 参数说明

| 参数名 | 必选 | 示例 | 说明 |
| ----- | --- | ---- | ---- |
| target | 是 | clash | 目标订阅类型 |
| url | 是 | https%3A%2F%2Fexample.com | 原始订阅链接，需要 URL 编码，多个链接用 \| 分隔 |
| config | 否 | https%3A%2F%2Fexample.com%2Fconfig.ini | 配置文件链接，需要 URL 编码 |
| emoji | 否 | true | 是否启用 Emoji |
| new_name | 否 | true | 是否使用新命名 |
| backend | 否 | https%3A%2F%2Fapi.example.com | 自定义后端服务地址 |
| token | 否 | your-secret-token | 访问令牌（如果启用了令牌验证） |

## 安全说明

如果您启用了访问令牌验证，请注意：

1. 令牌会在生成的链接中明文显示，请妥善保管
2. 建议使用复杂的随机字符串作为令牌
3. 如果令牌泄露，请及时更换

## 后端服务

本项目默认使用 `https://api.v1.mk` 作为后端服务。如需更改，可以：

1. 在 Web 界面中设置自定义后端地址
2. 修改 `src/index.js` 中的 `DEFAULT_BACKEND` 常量
3. 在 API 请求中添加 `backend` 参数

## 致谢

本项目基于 [subconverter](https://github.com/tindy2013/subconverter) 提供的后端服务。

## 许可证

MIT License 