import { z } from "zod";
import { entryStatuses, entryTypes } from "@/types/entry";

const slugRegex = /^[\p{L}\p{N}_-]+(?:-[\p{L}\p{N}_-]+)*$/u;

export const entryTypeSchema = z.enum(entryTypes);
export const entryStatusSchema = z.enum(entryStatuses);

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
    id: z.string().uuid("Entry ID 必须是 UUID。"),
    published_at: z.string().datetime().nullable().optional(),
    deleted_at: z.string().datetime().nullable().optional(),
  });

export type LoginInput = z.infer<typeof loginInputSchema>;
export type EntryCreateInput = z.infer<typeof entryCreateInputSchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateInputSchema>;
