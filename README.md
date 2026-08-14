# cyber-particle — DeepSeek Harness 粒子网络背景插件

[English](./README.en.md) | 中文

为 DeepSeek Harness Web 界面提供动态粒子网络背景：灰白散点从屏幕边缘随机飞入、直线穿过界面、离开后从新的边缘再次进入；彼此距离小于阈值的粒子自动连线，形成不断变化的网状结构。

渲染在界面全屏覆盖层上，`pointer-events` 穿透，不影响鼠标/键盘交互，也不改动任何界面配色。无 npm 运行时依赖。

## 效果预览

亮色主题：

![亮色主题效果](assets/image_light.png)

暗色主题：

![暗色主题效果](assets/image_dark.png)

## 安装

```sh
# 方式一：本地目录
dsh plugin --profile web add /path/to/dsh-cyber-particle

# 方式二：从 git 仓库安装
dsh plugin --profile web add github:AKS1st/dsh-cyber-particle

# 重启 web 服务使 profile 生效
dsh web
```

## 卸载

```sh
dsh plugin --profile web remove cyber-particle
dsh web
```

## 效果参数（client.js 顶部常量）

| 常量 | 默认 | 含义 |
| --- | --- | --- |
| `COUNT` | 52 | 散点数量 |
| `LINK` | 180 | 连线距离阈值（px） |
| 粒子颜色 | `rgba(125,137,153,0.9)` | 半径 2.2px 的灰点 |
| 连线颜色 | `rgba(110,122,140, 0.42·(1-d/LINK))` | 越近越清晰 |

调整后重启 dsh web 生效。
