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

从 GitHub 仓库安装（纯 JS，零构建，即装即用）：

```sh
dsh plugin --profile web add github:AKS1st/dsh-cyber-particle
dsh web   # 重启 web 服务使 profile 生效
```

本地安装（clone 后直接指向仓库目录）：

```sh
git clone https://github.com/AKS1st/dsh-cyber-particle.git
dsh plugin --profile web add /path/to/dsh-cyber-particle
dsh web
```

## 卸载

```sh
dsh plugin --profile web remove cyber-particle
dsh web
```

## 效果参数（client.js 顶部常量）

效果以 2560×1440（27" 2K）为参考视口，按设备像素比和视口面积自动归一化，
在不同分辨率/缩放的屏幕上保持一致的观感（线条粗细、粒子大小、连线密度都成比例缩放）：

| 参数 | 参考值 | 含义 |
| --- | --- | --- |
| `REF_W` / `REF_H` | 2560 / 1440 | 参考视口尺寸，其他屏幕按面积比例缩放 |
| `COUNT` | `52 × scale²`（24–90） | 散点数量，随面积增减，避免小屏过密 |
| `LINK` | `180 × scale` | 连线距离阈值（px） |
| `LINE_W` | `1.2 × scale` | 连线宽度（px） |
| `DOT_R` | `2.2 × scale` | 粒子半径（px） |
| 设备像素比 | 上限 2 | 高分屏（4K@200%）按 DPR 渲染，保持线条清晰不发虚 |

其中 `scale = √(视口面积 / 参考面积)`，并限制在 0.55–1.5 之间。
调整后重启 dsh web 生效。
