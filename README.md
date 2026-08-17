# cyber-particle — DeepSeek Harness 粒子网络背景插件

[English](./README.en.md) | 中文

为 DeepSeek Harness Web 界面提供动态粒子网络背景：灰白散点从屏幕边缘随机飞入、直线穿过界面、离开后从新的边缘再次进入；彼此距离小于阈值的粒子自动连线，形成不断变化的网状结构。

渲染在界面全屏覆盖层上，`pointer-events` 穿透，不影响鼠标/键盘交互，也不改动任何界面配色。无 npm 运行时依赖。

内置「设置 → 粒子背景」页：可实时调节粒子数量、半径、线条粗细、连线距离、移动速度，用调色板改粒子/线条颜色，一键重置为默认；调整即时生效并持久化到浏览器 `localStorage`，刷新页面或重启后自动恢复。设置页文案跟随 DSH 语言设置（中文 / English）。

> 服务端无任何行为：所有渲染与设置都在浏览器侧完成，不注册任何 webServer 路由，可被 dshmarket 像皮肤一样热切换（不产生路由冲突）。

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

## 可调参数（设置 → 粒子背景）

效果以 2560×1440（27" 2K）为参考视口，按设备像素比和视口面积自动归一化，
在不同分辨率/缩放的屏幕上保持一致的观感（线条粗细、粒子大小、连线密度都成比例缩放）。

设置页用「少/多、小/大、细/粗、近/远、慢/快」等定性档位展示（极少/少/适中/多/极多），
不显示绝对数值，避免不同屏幕尺寸下数值歧义；下表为内部实际取值。

| 参数 | 默认值 | 范围 | 含义 |
| --- | --- | --- | --- |
| 粒子数量 | 52 | 10–120 | 基准数量，绘制时按 `scale²` 缩放（8–240 截断） |
| 粒子半径 | 2.2 | 0.5–6 | 半径（px），按 `scale` 缩放 |
| 线条粗细 | 1.2 | 0.2–4 | 连线宽度（px），按 `scale` 缩放 |
| 连线距离 | 180 | 40–400 | 连线阈值（px），按 `scale` 缩放 |
| 移动速度 | 3.0 | 0.5–8 | 基准速度，实际在 `2/3×` 到 `1.4×` 间随机 |
| 粒子颜色 | `#7d8999` | 调色板 | 散点颜色（固定 0.9 透明度） |
| 线条颜色 | `#6e7a8c` | 调色板 | 连线颜色（透明度随距离衰减） |

其中 `scale = √(视口面积 / 参考面积)`，限制在 0.55–1.5；设备像素比上限 2，
高分屏（4K@200%）按 DPR 渲染保持线条清晰。

设置写入浏览器 `localStorage`（键 `cyber-particle:config`），刷新页面或重启 dsh web 后自动恢复。
