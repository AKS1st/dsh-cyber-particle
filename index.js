/**
 * Cyber Particle Network — node half.
 *
 * 服务端侧无任何行为：全部渲染与设置都在浏览器侧完成（见 client.js），
 * 配置持久化到浏览器 localStorage，不注册 webServer 路由、不依赖宿主
 * 服务，因此可被 dshmarket 像皮肤一样热切换，不会产生重复路由冲突。
 */
export function apply() {}
