# 阶段 2 验收说明

本文档用于验收当前仓库的阶段 2：Supabase 数据库、登录认证、后台访问保护、RLS 和 Storage 权限基础。

阶段 2 不包含内容 CRUD、Tiptap 编辑器、图片上传界面和自动保存。

## 当前真实文件清单

1. Supabase 浏览器客户端文件：`src/lib/supabase/client.ts`
2. Supabase 服务端客户端文件：`src/lib/supabase/server.ts`
3. Supabase proxy 客户端文件：`src/lib/supabase/proxy.ts`
4. 路由保护入口文件：`src/proxy.ts`
5. 登录页面：`src/app/login/page.tsx`
6. 登录表单组件：`src/components/auth/LoginForm.tsx`
7. 登录/退出 Server Action：`src/actions/auth.ts`
8. 管理员状态检查：`src/lib/auth/admin.ts`
9. `/studio` 页面：`src/app/studio/page.tsx`
10. 数据库 migration 文件：`supabase/migrations/0001_initial_schema.sql`
11. entries 表定义：`supabase/migrations/0001_initial_schema.sql`
12. app_admins 表定义：`supabase/migrations/0001_initial_schema.sql`
13. RLS Policies：`supabase/migrations/0001_initial_schema.sql`
14. Storage Bucket 和 Storage Policies：`supabase/migrations/0001_initial_schema.sql`
15. 数据库 TypeScript 类型：`src/types/database.ts`
16. 环境变量示例：`.env.example`
17. Supabase 设置说明：`SETUP_SUPABASE.md`

## 阶段 2 做了什么

代码中已经准备了 Supabase SSR 客户端：

- 浏览器端使用 `src/lib/supabase/client.ts`。
- 服务端使用 `src/lib/supabase/server.ts`。
- Proxy/路由保护使用 `src/lib/supabase/proxy.ts` 和 `src/proxy.ts`。

代码中已经准备了登录和后台保护：

- `/login` 只提供邮箱和密码登录，不提供公开注册。
- `/studio` 会检查当前用户是否已登录。
- `/studio` 还会检查当前用户 UID 是否存在于 `public.app_admins`。
- 不是管理员的用户会被重定向回 `/login?reason=not-admin`。

数据库 migration 中已经准备：

- `public.entries` 内容表。
- `public.app_admins` 管理员白名单表。
- `public.is_app_admin()` 管理员判断函数。
- `entries` 的 RLS 策略。
- `content-images` Storage bucket。
- `storage.objects` 上针对 `content-images` 的读取、上传、更新、删除策略。

## 你需要在 Supabase 页面中点击哪里

1. 打开 Supabase Dashboard。
2. 进入你的项目。
3. 左侧点击 `SQL Editor`。
4. 点击 `New query`。
5. 把本仓库的 migration SQL 粘贴进去并运行。
6. 左侧点击 `Authentication`，再点击 `Users`，用于创建管理员账号。
7. 左侧点击 `Table Editor`，用于查看 `entries` 和 `app_admins`。
8. 左侧点击 `Storage`，用于查看 `content-images` bucket。

## 需要复制哪个 migration 文件

复制这个文件的全部内容：

```text
supabase/migrations/0001_initial_schema.sql
```

不要只复制一部分。这个文件同时包含表、函数、RLS、Storage bucket 和 Storage policies。

## SQL 粘贴到哪里

在 Supabase Dashboard 中：

1. 打开 `SQL Editor`。
2. 点击 `New query`。
3. 粘贴 `supabase/migrations/0001_initial_schema.sql` 的全部内容。
4. 点击 `Run`。

成功后，一般不会报错。随后你应该能在 `Table Editor` 看到：

- `entries`
- `app_admins`

并且在 `Storage` 看到：

- `content-images`

## 如何创建管理员账号

1. 打开 Supabase Dashboard。
2. 左侧点击 `Authentication`。
3. 点击 `Users`。
4. 点击 `Add user`。
5. 填写你的管理员邮箱和密码。
6. 创建用户。

不要把真实邮箱或密码写进仓库、文档或 issue。

## 如何找到管理员 UID

1. 进入 `Authentication` -> `Users`。
2. 点击刚创建的管理员用户。
3. 找到用户的 `User ID` 或 `UID`。
4. 复制这个 UID。

不要把真实 UID 写进仓库。

## 如何写入 app_admins

在 Supabase `SQL Editor` 新建 Query，运行下面 SQL。

把占位符换成你自己的管理员 UID：

```sql
insert into public.app_admins (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

成功后，在 `Table Editor` -> `app_admins` 中应该看到 1 行数据，`user_id` 等于你的管理员 UID。

## .env.local 应该放在哪里

`.env.local` 应该放在项目根目录，也就是和 `.env.example`、`package.json` 同级的位置：

```text
D:\codex\个人博客\.env.local
```

可以先复制 `.env.example`：

```powershell
Copy-Item .env.example .env.local
```

然后填写：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_URL` 填 Supabase Project URL。

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 填 Supabase Publishable Key。

不要填写 service role key。

## 如何启动项目

安装依赖：

```bash
npm install
```

启动本地开发服务器：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 如何测试登录

1. 确认 `.env.local` 已填写真实 Supabase URL 和 Publishable Key。
2. 确认 migration 已经在 Supabase SQL Editor 运行成功。
3. 确认管理员账号已经在 Supabase Auth 创建。
4. 确认管理员 UID 已经写入 `public.app_admins`。
5. 打开 `http://localhost:3000/login`。
6. 输入管理员邮箱和密码。
7. 登录成功后，应该跳转到 `http://localhost:3000/studio`。
8. 页面应该显示后台已连接、当前管理员邮箱、数据库连接状态和退出登录按钮。

## 如何测试未登录不能进入 /studio

1. 打开一个无痕窗口，或者先点击 `/studio` 页面中的退出登录。
2. 直接访问 `http://localhost:3000/studio`。
3. 成功结果：页面应该跳转到 `/login`。
4. 不应该看到 `/studio` 的后台内容。

## 如何测试非管理员不能进入后台

1. 在 Supabase `Authentication` -> `Users` 中创建另一个普通测试用户。
2. 不要把这个普通用户的 UID 写入 `app_admins`。
3. 用普通用户邮箱和密码登录 `/login`。
4. 成功结果：应该被拒绝进入后台，并回到 `/login`。
5. 页面应该显示当前账号不是管理员的提示。

## 如何验证 entries 已启用 RLS

在 Supabase Dashboard 中：

1. 打开 `Table Editor`。
2. 选择 `entries`。
3. 查看表设置，确认 RLS 已启用。

也可以在 `SQL Editor` 运行本文后面的“阶段 2 测试 SQL”。

成功结果：

- `entries` 的 `rowsecurity` 应该是 `true`。
- 匿名用户只能读取 `status = 'published'` 且 `deleted_at is null` 的内容。
- 管理员可以读取、插入、更新、删除。
- 非管理员认证用户不能插入、更新、删除。

## 如何验证 content-images 的权限

在 Supabase Dashboard 中：

1. 打开 `Storage`。
2. 确认存在 bucket：`content-images`。
3. 确认 bucket 是 public。
4. 确认文件大小限制是 5MB。
5. 确认 MIME 类型限制包含 `image/jpeg`、`image/png`、`image/webp`。
6. 打开 Storage policies，确认存在针对 `content-images` 的 select、insert、update、delete policies。

成功结果：

- 匿名用户可以读取 `content-images` 中的公开图片。
- 只有 `app_admins` 中的管理员可以写入。
- 管理员上传路径第一段必须是自己的用户 UID。

阶段 2 没有图片上传 UI，所以 Storage 写入测试需要在 Supabase Dashboard、API 客户端或后续阶段中验证。

## 阶段 2 测试 SQL

下面 SQL 只做检查，不会写入真实邮箱、密码、UID 或密钥。

可以在 Supabase `SQL Editor` 中运行：

```sql
select
  'entries table exists' as check_name,
  to_regclass('public.entries') is not null as ok;

select
  'app_admins table exists' as check_name,
  to_regclass('public.app_admins') is not null as ok;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('entries', 'app_admins')
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('entries', 'app_admins')
order by tablename, policyname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Anyone can read content images',
    'Admins can upload content images',
    'Admins can update content images',
    'Admins can delete content images'
  )
order by policyname;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'content-images';

select
  'current user is admin' as check_name,
  public.is_app_admin() as ok;

select
  count(*) as app_admins_count
from public.app_admins;
```

你应该看到：

- `entries table exists` 的 `ok` 是 `true`。
- `app_admins table exists` 的 `ok` 是 `true`。
- `entries` 和 `app_admins` 的 `rls_enabled` 是 `true`。
- `entries` 有公开读取已发布内容的 policy，也有管理员 select、insert、update、delete policies。
- `storage.objects` 有 `content-images` 的读取、上传、更新、删除 policies。
- `storage.buckets` 中存在 `content-images`。
- 登录为管理员并运行时，`current user is admin` 应该是 `true`。
- `app_admins_count` 应该大于等于 1。

如果你没有以管理员身份登录 Supabase SQL Editor，`public.is_app_admin()` 的结果可能不是 `true`。这不一定代表代码错误，要结合实际登录测试判断。

