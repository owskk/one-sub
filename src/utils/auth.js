/**
 * 验证访问令牌
 * @param {Request} request - 请求对象
 * @param {string} adminToken - 管理员令牌
 * @param {string} visitorToken - 访客令牌
 * @returns {Object} - 包含验证结果和权限级别
 */
export function verifyToken(request, adminToken, visitorToken) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return { authenticated: false, isAdmin: false };
  }

  if (token === adminToken) {
    return { authenticated: true, isAdmin: true };
  }

  if (token === visitorToken) {
    return { authenticated: true, isAdmin: false };
  }

  return { authenticated: false, isAdmin: false };
}

/**
 * 生成带有令牌的URL
 * @param {Request} request - 请求对象
 * @param {string} token - 令牌
 * @returns {string} - 带有令牌的URL
 */
export function generateTokenUrl(request, token) {
  const url = new URL(request.url);
  url.searchParams.set('token', token);
  return url.toString();
} 