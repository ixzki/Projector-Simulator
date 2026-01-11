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

## ☁️ 部署指南

### 1. 上传到 GitHub

1. 在 GitHub 上创建一个新的空仓库 (Repository)。
2. 在本地项目根目录下执行以下命令：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
*(请将 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替换为你的 GitHub 用户名和仓库名)*

### 2. Vercel 一键部署

项目上传到 GitHub 后，你可以点击下方按钮进行一键部署（需登录 Vercel）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)

**注意**：请手动替换上方链接中的 `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME` 为你实际的仓库地址，或者直接在 Vercel 控制台导入你的 GitHub 仓库即可自动识别并部署（无需额外配置，Vercel 会自动识别 Vite 项目）。

## 🛠️ 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Shadcn/ui
