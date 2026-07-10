import { z } from "zod";
import { entryStatuses, entryTypes } from "@/types/entry";

const slugRegex = /^[\p{L}\p{N}_-]+(?:-[\p{L}\p{N}_-]+)*$/u;

export const entryTypeSchema = z.enum(entryTypes);
export const entryStatusSchema = z.enum(entryStatuses);
export const entryIdSchema = z.string().uuid("Entry ID must be a UUID.");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug 不能为空。")
  .max(120, "Slug 不能超过 120 个字符。")
  .regex(slugRegex, "Slug 只能包含文字、数字、下划线和连字符。");

export const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(24, "标签不能超过 24 个字符。");

export const projectMetadataSchema = z.object({
  projectStatus: z
    .enum(["idea", "in_progress", "iterating", "completed", "paused"])
    .optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  techStack: z.array(tagSchema).max(12).optional(),
  repositoryUrl: z.string().url().nullable().optional(),
  demoUrl: z.string().url().nullable().optional(),
});

export const loginInputSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱。"),
  password: z.string().min(1, "请输入密码。"),
});

export const entryCreateInputSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空。").max(120),
  slug: slugSchema,
  type: entryTypeSchema,
  status: entryStatusSchema.default("draft"),
  summary: z.string().max(300).nullable().optional(),
  content_json: z.unknown(),
  content_text: z.string().nullable().optional(),
  cover_path: z.string().nullable().optional(),
  tags: z.array(tagSchema).max(16).default([]),
  featured: z.boolean().default(false),
  featured_order: z.number().int().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const entryUpdateInputSchema = entryCreateInputSchema
  .partial()
  .extend({
    id: entryIdSchema,
    published_at: z.string().datetime().nullable().optional(),
    deleted_at: z.string().datetime().nullable().optional(),
  });

export type LoginInput = z.infer<typeof loginInputSchema>;
export type EntryCreateInput = z.infer<typeof entryCreateInputSchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateInputSchema>;
export const entryFormInputSchema = z.object({
  id: entryIdSchema,
  title: z.string().trim().min(1, "标题不能为空。").max(120, "标题不能超过 120 个字符。"),
  slug: slugSchema,
  type: entryTypeSchema,
  summary: z.string().trim().max(300, "摘要不能超过 300 个字符。").nullable(),
  content_text: z.string().trim().max(40000, "正文不能超过 40000 个字符。").nullable(),
  tags: z.array(tagSchema).max(16, "标签最多 16 个。"),
  featured: z.boolean(),
  featured_order: z.number().int().nullable(),
  metadata: projectMetadataSchema,
});

export const newEntryInputSchema = z.object({
  type: entryTypeSchema,
});

export type EntryFormInput = z.infer<typeof entryFormInputSchema>;
export type NewEntryInput = z.infer<typeof newEntryInputSchema>;
