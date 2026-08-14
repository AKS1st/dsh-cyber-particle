# cyber-particle — DeepSeek Harness 粒子网络背景插件

[English](./README.en.md) | 中文

为 DeepSeek Harness Web 界面提供动态粒子网络效果：灰白散点随机从屏幕边缘
飞入、直线穿过界面、离开后从新的边缘再次进入；彼此距离小于阈值的粒子自动
连线，形成不断变化的网状结构。

粒子渲染在界面全屏覆盖层（`shell.overlay`）上、位于 UI 内容之上，但整个
覆盖层 `pointer-events` 穿透，不影响鼠标/键盘交互，也不改动任何界面配色。

依赖 DeepSeek Harness 的 dsh web shell（client bundle 经 `__ModuleLoader__`
模块系统注册），本身无 npm 运行时依赖。

## 效果预览

亮色主题：

![亮色主题效果](assets/image_light.png)

暗色主题：

![暗色主题效果](assets/image_dark.png)

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包声明：`dsh.bundle.patch`（标准 bundle 挂载）、`dsh.client.platform: "web"`、`./client` 导出（client-modules 扫描用） |
| `client.js` | 浏览器端 bundle：`window.__ModuleLoader__.load({ id, factory })` 注册插件，Canvas 粒子动画 |
| `index.js` | Node 半部：空 `apply`，使插件行在 host loader 中激活 |
| `cordis.patch.yml` | bundle patch 层：`dsh plugin` 安装后自动作为一层 patch 挂载插件行 |
| `README.md` | 本文档（中文，主文档） |
| `README.en.md` | 英文版文档 |
| `assets/` | 效果预览截图（亮色 / 暗色主题） |

## 安装（标准 bundle 方式）

本仓库是标准 dsh bundle：package.json 声明 `dsh.bundle.patch`（`cordis.patch.yml`），
`dsh plugin` 安装后会自动把它加入 `dsh.profile.bundles`，由 patch 层挂载插件行。

```sh
# 方式一：本地目录
dsh plugin --profile web add /path/to/dsh-cyber-particle

# 方式二：从 git 仓库安装
dsh plugin --profile web add github:AKS1st/dsh-cyber-particle

# 重启 web 服务使 profile 生效
dsh web
```

`dsh plugin add` 在 profile 目录执行 pnpm 安装，检测到 `dsh.bundle` 声明后
自动把 `cyber-particle` 追加到 `dsh.profile.bundles`；其 `cordis.patch.yml`
作为一层 patch 挂载插件行。重启后插件自动生效，无需批准，进程重启也不丢失。

## 卸载

```sh
dsh plugin --profile web remove cyber-particle
dsh web
```

## 从旧版（install.sh）迁移

早期版本通过 `install.sh` 手动安装：包文件直接复制到
`$DSH_HOME/profiles/web/node_modules/cyber-particle/`，插件行手写进 profile
的 `cordis.patch.yml`。若已按旧方式安装，迁移到标准方式：

```bash
# 1. 删除 profile 用户层里手写的 cyber-particle 行（编辑
#    $DSH_HOME/profiles/web/cordis.patch.yml），避免与 bundle 层重复挂载
# 2. 删除旧包目录（DSH_HOME 未设置时默认 ~/.dsh）
rm -rf "${DSH_HOME:-$HOME/.dsh}/profiles/web/node_modules/cyber-particle"
# 3. 用标准方式重新安装
dsh plugin --profile web add /path/to/dsh-cyber-particle
# 4. 重启 dsh web
```

## 效果参数（client.js 顶部常量）

| 常量 | 默认 | 含义 |
| --- | --- | --- |
| `COUNT` | 52 | 散点数量 |
| `LINK` | 180 | 连线距离阈值（px） |
| 粒子颜色 | `rgba(125,137,153,0.9)` | 半径 2.2px 的灰点 |
| 连线颜色 | `rgba(110,122,140, 0.42·(1-d/LINK))` | 越近越清晰 |

调整后重启 dsh web 生效。
