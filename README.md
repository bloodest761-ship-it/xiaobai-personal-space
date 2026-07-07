# 小白的个人内容空间

一个面向长期写作、项目记录、知识理解和成长复盘的个人内容空间。

当前仓库处于阶段 0：基础工程。此阶段只完成 Next.js、TypeScript、Tailwind CSS、Lint、类型检查和构建基础，不包含数据库、登录、后台、编辑器或图片上传。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint

## 本地安装

```bash
npm install
```

## 本地启动

```bash
npm run dev
```

默认预览地址：

```text
http://localhost:3000
```

## 代码检查

```bash
npm run lint
npm run typecheck
```

## 生产构建

```bash
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后填写本地配置。不要提交 `.env.local` 或任何真实密钥。

阶段 0 不连接 Supabase，`.env.example` 仅保留后续阶段需要的变量名。
