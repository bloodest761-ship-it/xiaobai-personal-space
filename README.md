# 小白的个人内容空间

一个面向长期写作、项目记录、知识理解和成长复盘的个人内容空间。

当前仓库已完成阶段 2：Supabase 数据库、认证、Storage 和权限基础。公开端仍使用本地 mock 数据；后台只提供最小受保护入口，不包含完整内容管理、编辑器或图片上传界面。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase SSR
- Zod
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

阶段 2 需要 Supabase Project URL 和 Publishable Key。具体配置步骤见 `SETUP_SUPABASE.md`。
