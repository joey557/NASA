# Quick Start Guide

## 1. 运行项目

```bash
cd NASA/tempo-air-quality
npm install
npm run dev
```

## 2. 获取 API Key

- 访问：https://www.maptiler.com/
- 点击 "Sign Up" 注册免费账户
- 登录后进入 Dashboard
- 找到 "API Keys" 部分，复制你的 API Key

## 3. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_MAPTILER_KEY=你的API密钥
```

## 4. 重新运行

```bash
npm run dev
```

## 5. 打开浏览器

访问：http://localhost:3000

## 常见问题

- 确保在 `tempo-air-quality` 目录下运行命令
- 确保 `.env.local` 文件在正确位置
- 如果地图不显示，检查 API Key 是否正确
