# 性能优化报告

## 优化前问题

- `proxy.ts` 匹配全部页面；公开页面每次请求都会执行 `supabase.auth.getUser()`。
- 首页的精选文章、精选项目和最近更新分别读取 Supabase，并且每次读取了完整正文、JSON 和元数据。
- 分类页会查询当前分类后再额外查询全部项目；分类卡片也各自请求数据。
- 详情页的 `generateMetadata()`、页面主体和上一篇/下一篇读取重复或读取全部文章。
- Studio 的 proxy、各子页面和数据层都会重复验证当前管理员。
- 后台列表和公开列表均没有统一的显式读取上限。

## 修改内容

- 将公开内容读取集中到 `src/lib/public-content.ts`，并按列表/详情区分字段。
- 为首页、分类、详情和分类统计增加 Next.js Data Cache（5 分钟 revalidate）。
- 后台列表增加 `limit` / `offset` 参数，并默认最多读取 50 条、硬上限 100 条。
- 删除未使用的旧 `src/lib/entries.ts`，避免遗留的无限完整字段查询。
- 增加 Studio 和 space 的路由级骨架屏。

## 鉴权优化

- proxy 现在只匹配 `/login` 与 `/studio/:path*`；`/`、`/space/*`、`/entry/*`、`/project/*`、`/about` 不再进入 Supabase 鉴权流程。
- proxy 仅验证会话，并在内部请求头中传递已经验证的身份；外部传入的同名头会先移除。
- `src/app/studio/layout.tsx` 是唯一的页面级管理员边界：未登录跳转 `/login?next=/studio`，非管理员跳转 `/login?reason=not-admin`。
- 布局与后台数据读取通过 React request cache 复用一次 `app_admins` 查询。RLS、`app_admins` 和所有 Server Action 中的管理员检查均保留。

## 数据查询优化

- 首页：缓存未命中时由 `getHomeContent()` 以一次、最多 20 条的轻量字段查询生成三个区块。
- 分类列表：仅查询对应 `type`，最多 20 条；不再为项目分类额外查询全部项目。
- 列表字段仅包括标题、slug、类型、摘要、封面、标签和时间（额外保留首页排序所需的精选字段）；正文 JSON、正文文本、项目元数据只在详情读取。
- 详情的 metadata 与页面主体通过 request cache 复用同一条完整内容查询。
- 上一篇/下一篇改为按 `published_at` 向前/向后各取 1 条，不再拉取全部文章。

## 缓存策略

- 公开内容使用 `unstable_cache`，缓存时间为 300 秒，并设置首页、列表与详情标签。
- 公开页面设置 `revalidate = 300`。
- 发布、撤回、归档、软删除、恢复及编辑保存时，会调用 `revalidateTag` 与 `revalidatePath`，即时失效相关公开内容和 Studio 页面缓存。

## Loading 优化

- 已有：`src/app/loading.tsx`。
- 新增：`src/app/space/loading.tsx`、`src/app/studio/loading.tsx`。
- 均为无动画的简洁骨架屏。

## 请求数量变化

以下是依据代码路径得出的请求结构，非浏览器实测耗时：

| 场景 | 优化前 | 优化后 |
| --- | --- | --- |
| 首页 Supabase 内容读取 | 3 次完整列表读取 | 缓存未命中 1 次轻量列表读取；命中缓存 0 次 |
| `/space/[type]` | 当前类型全量读取 + 全部项目读取 | 当前类型 1 次、最多 20 条 |
| 详情正文 | metadata 与页面主体重复读取，导航读取全部文章 | 1 次完整详情读取（同请求复用）+ 上/下篇各 1 条限制查询 |
| Studio 首页管理员校验 | proxy、页面、数据层重复 | proxy 1 次会话验证 + 布局/数据层复用 1 次管理员查询 |

## 已验证页面

- 静态检查：`npm run lint` 通过。
- 类型检查：`npm run typecheck` 通过。
- 代码审查：公开页面组件保持 Server Component；仅错误边界、登录表单、编辑器与上传组件保留 `"use client"`。
- 图片审查：公开卡片和项目详情图片继续使用 `next/image`，并提供 `alt` 与固定 `width` / `height`；未对用户上传内容做自动压缩。

## 未解决问题

- 当前执行环境没有可交互浏览器 Network 面板，因此没有虚构首页首次打开、space 跳转、详情打开和 Studio 打开的网络耗时数据。发布后应在浏览器 DevTools Network 中按本报告的请求结构复核。
- 首页单次查询上限为 20 条；很早之前的精选内容若不在最近 20 条内不会进入首页精选。若内容量增长且需维持全量精选排序，应增加受 RLS 保护的 Supabase RPC/视图，而不是恢复全表读取。

## 后续优化建议

1. 在生产环境用 Network 与 Web Vitals 记录真实的缓存命中、Supabase 请求和页面导航耗时。
2. 当内容超过首页上限的业务范围时，增加只返回首页所需字段的数据库函数或视图。
3. 为后台列表补充基于 `offset` / cursor 的可见分页控件。
4. 在上传流程增加可选的服务端派生图或响应式图片策略；不要自动修改原始用户上传文件。
