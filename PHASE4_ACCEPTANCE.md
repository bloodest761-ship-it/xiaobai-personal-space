# 阶段 4 验收报告

验收日期：2026-07-11。范围仅为编辑器、图片、自动保存与公开 JSON 渲染；未实现阶段 5 的搜索、导出、SEO、sitemap 或其他功能。

## 编辑器完成情况

- Tiptap 实现在 `src/components/editor/RichTextEditor.tsx`，扩展在 `src/components/editor/extensions.ts`。
- 支持段落、H2/H3、加粗、斜体、删除线、无序/有序列表、引用、行内代码、代码块、分割线、链接、图片、撤销与重做。
- 自定义节点：`callout`、`insightShift`、`imageFigure`、`projectOverview`；内容保存为 `content_json`，纯文本由 `editorDocumentToText` 同步维护为 `content_text`。
- 编辑器与表单体验在 `src/components/editor/EntryEditorForm.tsx`；`/studio/edit/[id]` 只负责鉴权和页面布局。

## 图片上传测试

- 已用真实 Supabase 管理员会话上传 JPG 与 PNG。
- JPG：Storage HTTP `200`，`image/jpeg`；PNG：Storage HTTP `200`，`image/png`。
- 对象路径均为 `content-images/{userId}/{entryId}/{uuid}.{ext}`，实际对象键以 bucket 内 `{userId}/{entryId}/{uuid}.{ext}` 上传。
- `ImageUploader.tsx` 在客户端确认登录和 `app_admins` 身份，并让 Supabase Storage RLS 再次执行写入授权；未使用 service role。
- 客户端拒绝非 JPG/PNG/WebP 与超过 5MB 的文件；支持错误提示和重试。按正式需求，删除正文图片节点不自动删除 Storage 文件，防止误删。

## 自动保存测试

- `EntryEditorForm.tsx` 在编辑变更后 debounce 约 1200ms 保存；显示保存中、已保存、失败和最后保存时间。
- 真实浏览器测试创建/加载阶段 4 测试文章并输入文本，`content_text` 与 `updated_at` 在 Supabase 中更新。
- localStorage 临时副本、恢复入口、保存失败保留内容与 `beforeunload` 未保存提醒已实现。
- 发布操作通过 `publishEditorEntryAction` 先执行同一份编辑器数据的保存，再发布。
- 保存使用 `updated_at` 乐观并发检查，并对空属性的自定义节点回填原关联属性，防止旧保存请求覆盖图片或自定义块数据。

## 自定义组件测试

- 真实测试 JSON 包含提示块、认知变化块和两张带 alt/caption 的图片；浏览器编辑器能载入这些节点。
- 公开端 `RichContent.tsx` 按白名单递归渲染 JSON，不使用 HTML 注入；链接只接受 `http(s)`/`mailto`，图片只接受 `http(s)`。
- 项目概览节点可在 project 编辑器中插入并在公开端渲染状态、技术栈、时间和仓库地址。

## 公开渲染测试

- 真实 Supabase 测试记录先以 draft 创建，匿名公开筛选查询不可见；发布后可见。
- `src/lib/public-content.ts` 保持 `status = published` 与 `deleted_at is null` 筛选。
- 心得详情页和项目详情页均使用 `RichContent` 渲染 `content_json`；阶段 3 的普通 JSON 段落仍可渲染。

## 未完成内容

- 没有实现阶段 5 的搜索、导出、SEO、sitemap、AI 写作、评论、点赞、多用户或移动 App。
- 图片上传的底层 Storage 进度 API 不提供逐字节进度，本阶段显示“上传中”状态而非百分比。
