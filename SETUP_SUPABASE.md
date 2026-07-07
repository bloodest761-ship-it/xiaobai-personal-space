# Supabase 设置指南

本文档用于阶段 2：Supabase 数据库、身份认证、Storage 和权限基础。不要把真实密钥、密码或管理员 UID 写入仓库。

## 1. 创建 Supabase 项目

1. 打开 Supabase Dashboard。
2. 创建一个新项目。
3. 记录项目所在组织、项目名称和数据库密码。数据库密码只保存在你自己的密码管理工具里，不写入仓库。

## 2. 找到 Project URL

进入项目后：

1. 打开 Project Settings。
2. 打开 API。
3. 找到 Project URL。
4. 将它填入本地 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL`。

## 3. 找到 Publishable Key

在 Project Settings 的 API 页面找到 Publishable Key。

填入：

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

不要使用 service role key。本阶段不需要服务端秘密密钥。

## 4. 创建 `.env.local`

复制 `.env.example`：

```bash
cp .env.example .env.local
```

Windows PowerShell 可以使用：

```powershell
Copy-Item .env.example .env.local
```

填写：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` 已在 `.gitignore` 中，不能提交。

## 5. 运行 migration

Migration 文件位置：

```text
supabase/migrations/0001_initial_schema.sql
```

### 方法 A：Dashboard SQL Editor

1. 打开 Supabase Dashboard。
2. 进入 SQL Editor。
3. 新建 Query。
4. 复制 `supabase/migrations/0001_initial_schema.sql` 的全部内容。
5. 点击 Run。

### 方法 B：Supabase CLI

如果已安装并登录 Supabase CLI：

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

后续生成 TypeScript 类型可使用：

```bash
supabase gen types typescript --linked > src/types/database.ts
```

当前仓库已提供与 migration 对应的手写类型。

## 6. 手动创建管理员账号

1. 打开 Authentication。
2. 进入 Users。
3. 点击 Add user。
4. 填写管理员邮箱和密码。
5. 不要开启公开注册流程。

## 7. 找到管理员用户 UID

在 Authentication 的 Users 列表中打开管理员用户详情，复制用户 ID。

不要把真实 UID 写入仓库、README 或 issue。

## 8. 插入 `app_admins`

在 SQL Editor 中运行：

```sql
insert into public.app_admins (user_id)
values ('替换为管理员用户 UID');
```

只在 Supabase Dashboard 中运行，不提交到仓库。

## 9. 确认 RLS 已启用

在 Table Editor 中检查：

- `public.entries` 已启用 RLS；
- `public.app_admins` 已启用 RLS；
- `entries` 存在公开读取已发布内容的 policy；
- `entries` 存在管理员 select、insert、update、delete policy。

匿名用户只能读取：

```text
status = 'published'
AND deleted_at IS NULL
```

## 10. 确认 Storage Bucket 和 Policy

Migration 会创建：

```text
content-images
```

配置：

- public bucket；
- 文件大小限制 5MB；
- MIME 限制：JPG、PNG、WebP；
- 匿名用户可读取图片；
- 只有 `app_admins` 中的管理员可以上传、更新、删除；
- 对象路径第一段必须是当前管理员用户 ID。

注意：公开 bucket 中，只要获得图片 URL 就可以直接读取。因此草稿图片 URL 不应出现在公开页面、公开接口或公开 HTML 中。

## 11. 启动项目

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 12. 测试登录

打开：

```text
http://localhost:3000/login
```

使用在 Supabase Auth 中创建的管理员邮箱和密码登录。成功后应跳转：

```text
http://localhost:3000/studio
```

后台只显示：

- 后台已连接；
- 当前管理员邮箱；
- 数据库连接状态；
- 退出登录按钮；
- “内容管理将在阶段 3 实现”。

## 13. 确认草稿不可公开读取

可以在 SQL Editor 中插入一条 `draft` 内容，然后用匿名请求读取公开接口或公开页面。阶段 2 尚未把公开页面接到 Supabase，所以主要通过 SQL/RLS 检查确认：

- 匿名角色不能 select `draft`；
- 匿名角色不能 select `deleted_at is not null` 的内容；
- 匿名角色不能 insert、update、delete。

## 14. 常见错误

### 缺少环境变量

如果看到 Supabase 环境变量未配置的提示，检查 `.env.local` 是否存在，以及变量名是否是：

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

### 登录成功但不能进入后台

确认管理员用户 UID 已插入：

```sql
select * from public.app_admins;
```

### 普通账号进入后台

普通认证用户不应进入后台。如果发生异常，请检查：

- `proxy.ts` 是否生效；
- `app_admins` 是否误插入了普通用户 UID；
- `entries` RLS policy 是否仍使用 `public.is_app_admin()`。

### 图片上传被拒绝

阶段 2 没有图片上传 UI。后续测试 Storage 时，确认：

- bucket 是 `content-images`；
- 文件类型是 JPG、PNG 或 WebP；
- 文件小于 5MB；
- 路径第一段是管理员用户 UID；
- 当前登录用户存在于 `app_admins`。
