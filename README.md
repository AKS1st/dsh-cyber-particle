# cyber-particle — DeepSeek Harness 粒子网络背景插件

为 DeepSeek Harness Web 界面提供动态粒子网络效果：灰白散点随机从屏幕边缘
飞入、直线穿过界面、离开后从新的边缘再次进入；彼此距离小于阈值的粒子自动
连线，形成不断变化的网状结构。

粒子渲染在界面全屏覆盖层（`shell.overlay`）上、位于 UI 内容之上，但整个
覆盖层 `pointer-events` 穿透，不影响鼠标/键盘交互，也不改动任何界面配色。

依赖 DeepSeek Harness 的 dsh web shell（client bundle 经 `__ModuleLoader__`
模块系统注册），本身无 npm 运行时依赖。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包声明：`dsh.client.platform: "web"`、`./client` 导出（client-modules 扫描用） |
| `client.js` | 浏览器端 bundle：`window.__ModuleLoader__.load({ id, factory })` 注册插件，Canvas 粒子动画 |
| `index.js` | Node 半部：空 `apply`，使插件行在 host loader 中激活 |
| `install.sh` | 一键安装到当前 DSH web profile |

## 安装（当前已安装时无需重复）

```bash
./install.sh
```

脚本会把三个文件复制到 `$DSH_HOME/profiles/web/node_modules/cyber-particle/`，
并确保 `$DSH_HOME/profiles/web/cordis.patch.yml` 包含挂载行：

```yaml
- insert:
    - id: cyber-particle
      name: cyber-particle
```

**生效时机**：修改 profile 组合后需要重启 dsh web（`dsh web`）才会加载。
重启后插件自动生效，无需批准，进程重启也不丢失。

## 卸载

```bash
# 1. 从 patch 中删除 cyber-particle 行（编辑 cordis.patch.yml）
# 2. 删除包目录
rm -rf "${DSH_HOME:-$HOME/.dsh}/profiles/web/node_modules/cyber-particle"
# 3. 重启 dsh web
```

## 效果参数（client.js 顶部常量）

| 常量 | 默认 | 含义 |
| --- | --- | --- |
| `COUNT` | 52 | 散点数量 |
| `LINK` | 180 | 连线距离阈值（px） |
| 粒子颜色 | `rgba(125,137,153,0.9)` | 半径 2.2px 的灰点 |
| 连线颜色 | `rgba(110,122,140, 0.42·(1-d/LINK))` | 越近越清晰 |

调整后重启 dsh web 生效。
