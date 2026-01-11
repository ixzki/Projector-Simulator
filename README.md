# 投影仪侧投模拟器 (Projector Simulator)

一个专业的 2D 投影仪安装模拟与计算工具。支持自定义房间尺寸、投影仪参数（投射比、移轴）、自动梯形校正模拟及可视化展示。

## ✨ 功能特性

- **全参数调节**：房间尺寸、幕布位置/大小、投影仪位置/投射比/移轴。
- **双视图可视化**：
  - **正面视图**：模拟墙面投影效果、梯形畸变及校正后画面。
  - **俯视图**：展示光路覆盖与投射距离。
- **智能校正**：自动计算最大可用 16:9 画面，并显示像素利用率效率。
- **手动微调**：支持手动调节投影仪的偏航角 (Yaw) 和俯仰角 (Pitch)。
- **导出功能**：一键生成包含参数配置与可视化图表的图片报告。

## 🚀 快速开始

### 本地开发

需要 [Node.js](https://nodejs.org/) (推荐 v18+) 和 [pnpm](https://pnpm.io/)。

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建

```bash
pnpm build
```

构建产物位于 `dist/` 目录。

## ☁️Vercel 一键部署

你可以点击下方按钮进行一键部署（需登录 Vercel）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ixzki/Projects)


## 🛠️ 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Shadcn/ui
