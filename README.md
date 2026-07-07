# 小白的个人内容空间

一个面向长期写作、项目记录、知识理解和成长复盘的个人内容空间。

当前仓库已完成阶段 1：公开端页面和视觉骨架。此阶段使用本地 mock 数据完成首页、内容空间、分类页、内容详情页、项目详情页和关于页，不包含数据库、登录、后台、编辑器或图片上传。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint

## 已实现公开路由

- `/`：个人首页
- `/space`：内容空间
- `/space/reflection`：心得列表
- `/space/essay`：随笔列表
- `/space/project`：项目列表
- `/space/understanding`：理解列表
- `/entry/[slug]`：普通内容详情
- `/project/[slug]`：项目详情
- `/about`：关于页面

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

阶段 1 不连接 Supabase，`.env.example` 仅保留后续阶段需要的变量名。
