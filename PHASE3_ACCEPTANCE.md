# 阶段 3 验收报告

验收日期：2026-07-10。范围仅为阶段 3；没有实现 Tiptap、图片上传或自动保存。

## 阶段 3 实现内容

1. `/studio`：`src/app/studio/page.tsx`
2. `/studio/entries`：`src/app/studio/entries/page.tsx`
3. `/studio/new`：`src/app/studio/new/page.tsx`
4. `/studio/edit/[id]`：`src/app/studio/edit/[id]/page.tsx`
5. `/studio/trash`：`src/app/studio/trash/page.tsx`
6. 创建：`src/actions/entries.ts` 的 `createEntryAction`，调用 `src/lib/admin-entries.ts` 的 `createEntry`
7. 更新：`updateEntryAction` / `updateEntry`
8. 发布：`publishEntryAction` / `publishEntry`
9. 撤回：`unpublishEntryAction` / `unpublishEntry`
10. 归档：`archiveEntryAction` / `archiveEntry`
11. 软删除：`softDeleteEntryAction` / `softDeleteEntry`
12. 恢复：`restoreEntryAction` / `restoreEntry`
13. Slug：`src/lib/admin-entries.ts` 的 `slugify` 生成创建时的 slug；`supabase/migrations/0001_initial_schema.sql` 的 `entries.slug unique` 负责唯一性检查，`23505` 冲突会映射为保存错误。
14. Zod：`src/lib/validation/entry.ts`。创建、编辑、slug、标签、项目元数据及全部生命周期操作的 UUID 都由服务端解析；本次补齐了后者的 UUID 校验。
15. 公开数据读取：`src/lib/public-content.ts`；首页组件、`src/app/space/[type]/page.tsx`、`src/app/entry/[slug]/page.tsx`、`src/app/project/[slug]/page.tsx` 均通过它读取 Supabase。

## 真实 CRUD 测试结果

使用真实 Supabase 管理员会话完成测试。管理员资格已通过 `app_admins` 查询确认。测试记录 ID：`f72e063b-c4e3-4a7e-9b69-7e6d8c2586a9`；slug：`phase3-crud-acceptance-20260710-1783692941892`。

| 步骤 | 结果 |
| --- | --- |
| 1. 新建草稿 | 通过：创建标题为“阶段三 CRUD 验收测试”的 `reflection` 草稿。 |
| 2. 确认草稿不出现在公开页面 | 通过：匿名公开筛选查询没有返回该 slug。 |
| 3. 编辑标题、摘要、正文和标签 | 通过：标题改为“阶段三 CRUD 验收测试（已编辑）”，摘要、正文和 `阶段三`、`CRUD`、`验收` 标签均保存。 |
| 4. 发布 | 通过：状态变为 `published`，写入 `published_at`。 |
| 5. 确认公开页面出现 | 通过：匿名公开筛选查询返回该记录。 |
| 6. 修改正文并保存 | 通过：正文已更新为第二次保存的测试文本。 |
| 7. 确认 `updated_at` 更新 | 通过：第二次保存返回的 `updated_at` 为 `2026-07-10T14:15:50.504299Z`，并已与保存前的值作真实比较，结果为递增。 |
| 8. 撤回 | 通过：状态变为 `draft`。 |
| 9. 确认公开页面消失 | 通过：匿名公开筛选查询无返回值。 |
| 10. 再次发布 | 通过：状态再次为 `published`，首次 `published_at` 保持不变。 |
| 11. 软删除 | 通过：写入 `deleted_at`，没有执行物理删除。 |
| 12. 确认内容进入回收站 | 通过：管理员查询 `deleted_at is not null` 返回该记录。 |
| 13. 确认公开页面不可访问 | 通过：匿名公开筛选查询无返回值。 |
| 14. 从回收站恢复 | 通过：`deleted_at` 已清空。 |
| 15. 确认后台重新可见 | 通过：管理员查询 `deleted_at is null` 返回该记录。 |

## 权限测试结果

| 项目 | 结果 |
| --- | --- |
| 草稿只能管理员读取 | 真实验证：管理员能读草稿；匿名按公开条件查询读不到该草稿。RLS 迁移的公开策略也只允许 `published` 且 `deleted_at is null`。 |
| 匿名用户不能创建、修改或删除 entries | 真实验证：匿名插入被 RLS 拒绝，错误 `42501: new row violates row-level security policy for table "entries"`。当前没有另一个普通登录账户，匿名更新/删除和普通登录用户写入未单独执行。 |
| 非管理员不能操作后台 CRUD | 代码与 RLS 核查通过：后台页拒绝 `not-admin`，写策略要求 `is_app_admin()`。普通已认证非管理员账户未单独真实验证。 |
| 所有写操作都在服务端验证管理员 | 代码核查通过：Server Action 调用的 `src/lib/admin-entries.ts` 写函数均先调用 `requireAdmin()`。 |
| 所有输入经过 Zod 校验 | 代码核查通过：`src/lib/validation/entry.ts`；生命周期 action 的 UUID 校验已补齐。 |
| 删除是设置 `deleted_at`，不是真实 delete | 真实 CRUD 使用 `deleted_at` 并成功恢复。新增 `supabase/migrations/0002_disallow_hard_delete.sql`，用于在权限层撤销物理 `DELETE`；远程项目尚未确认已应用该迁移。 |
| `.env.local` 没有进入 Git | 通过：被 `.gitignore` 忽略且未被 Git 跟踪。 |

## 公开页面数据切换情况

`src/lib/public-content.ts` 的集合查询和 slug 查询都固定使用 `.eq("status", "published").is("deleted_at", null)`。本次已用匿名 Supabase 查询真实验证：草稿、撤回和软删除状态均不返回；两次发布状态均返回记录。

## 检查命令结果

| 命令 | 结果 |
| --- | --- |
| `git remote -v` | 通过：fetch/push 均为 `https://github.com/bloodest761-ship-it/xiaobai-personal-space.git`。 |
| `git branch --show-current` | 通过：`main`。 |
| `git status --short` | 阶段 3 实现、迁移和本报告均处于未提交状态。 |
| `git log --oneline -5` | 已检查；验收开始时 HEAD 为 `a16157c docs: add phase 2 acceptance report`。 |
| `npm run lint` | 通过。 |
| `npm run typecheck` | 通过。 |
| `npm run build` | 通过。首次 sandbox 内运行遇到 Next 子进程 `spawn EPERM`，在受限环境外重试后通过。 |

## 尚未实现的阶段 4 功能

- Tiptap 富文本编辑器；当前为普通 textarea，仅保存兼容 JSON。
- 图片上传、图片管理、编辑器内插图。
- 自动保存。

## 已知问题和风险

1. 远程 Supabase 尚未确认应用 `supabase/migrations/0002_disallow_hard_delete.sql`；在该迁移应用前，数据库层仍可能保留管理员的物理删除权限。
2. 匿名插入已真实验证；普通已认证但非管理员账户的写入拒绝尚未单独使用第二个账号验证。
3. 测试记录已恢复为后台可见的已发布记录，保留用于后续复查。
