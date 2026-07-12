import Image from "next/image";
import type { ReactNode } from "react";
import type { Json } from "@/types/database";

type RichContentProps = { content: Json };
type RichNode = { type?: unknown; text?: unknown; attrs?: unknown; marks?: unknown; content?: unknown };

export function RichContent({ content }: RichContentProps) {
  const root = asNode(content);
  if (!root || root.type !== "doc") return null;
  return <article className="editor-content space-y-6 text-lg leading-9 text-primary">{renderChildren(root.content)}</article>;
}

function renderNode(value: unknown, key: string): ReactNode {
  const node = asNode(value);
  if (!node) return null;
  const children = renderChildren(node.content);

  if (node.type === "text") return <span key={key}>{applyMarks(String(node.text ?? ""), node.marks, key)}</span>;
  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading") {
    const level = asRecord(node.attrs).level;
    if (level === 2) return <h2 key={key} className="mt-10 text-3xl font-semibold leading-tight">{children}</h2>;
    if (level === 3) return <h3 key={key} className="mt-8 text-2xl font-semibold leading-tight">{children}</h3>;
    return <p key={key}>{children}</p>;
  }
  if (node.type === "bulletList") return <ul key={key} className="list-disc space-y-2 pl-6">{children}</ul>;
  if (node.type === "orderedList") return <ol key={key} className="list-decimal space-y-2 pl-6">{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key} className="border-l-4 border-accent pl-5 text-secondary">{children}</blockquote>;
  if (node.type === "codeBlock") return <pre key={key} className="overflow-x-auto rounded-xl bg-primary p-5 text-sm leading-7 text-white"><code>{textFrom(node.content)}</code></pre>;
  if (node.type === "horizontalRule") return <hr key={key} className="border-border" />;
  if (node.type === "imageFigure") return renderImage(node, key);
  if (node.type === "callout") return renderCallout(node, key);
  if (node.type === "insightShift") return renderInsight(node, key);
  if (node.type === "projectOverview") return renderProjectOverview(node, key);
  return children;
}

function renderImage(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  const src = safeImageUrl(attrs.src);
  if (!src) return null;
  const alt = stringValue(attrs.alt);
  const caption = stringValue(attrs.caption);
  return <figure key={key} className="my-8 overflow-hidden rounded-2xl border border-border bg-surface"><Image src={src} alt={alt} width={1200} height={800} className="h-auto w-full object-cover" />{caption ? <figcaption className="px-5 py-3 text-sm text-muted">{caption}</figcaption> : null}</figure>;
}

function renderCallout(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  const type = ["tip", "warning", "conclusion"].includes(stringValue(attrs.type)) ? stringValue(attrs.type) : "tip";
  const labels: Record<string, string> = { tip: "提示", warning: "注意", conclusion: "结论" };
  return <aside key={key} className={`rounded-xl border p-5 ${type === "warning" ? "border-amber-200 bg-amber-50" : type === "conclusion" ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}><p className="font-medium text-primary">{labels[type]}</p><p className="mt-2 whitespace-pre-wrap text-secondary">{stringValue(attrs.content)}</p></aside>;
}

function renderInsight(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  return <section key={key} className="rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">认知变化</h2><dl className="mt-4 grid gap-4"><Definition label="过去我认为" value={stringValue(attrs.past)} /><Definition label="现在我认为" value={stringValue(attrs.present)} /><Definition label="为什么改变" value={stringValue(attrs.reason)} /></dl></section>;
}

function renderProjectOverview(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  const repositoryUrl = safeLink(attrs.repositoryUrl);
  return <section key={key} className="rounded-xl border border-border bg-surface p-5"><h2 className="text-lg font-semibold">项目概览</h2><dl className="mt-4 grid gap-3 sm:grid-cols-2"><Definition label="项目状态" value={stringValue(attrs.projectStatus)} /><Definition label="技术栈" value={stringValue(attrs.techStack)} /><Definition label="时间" value={stringValue(attrs.timeline)} /><div><dt className="text-sm text-muted">仓库地址</dt><dd className="mt-1">{repositoryUrl ? <a href={repositoryUrl} className="break-all text-accent underline" rel="noreferrer">{repositoryUrl}</a> : "-"}</dd></div></dl></section>;
}

function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value || "-"}</dd></div>; }
function renderChildren(value: unknown) { return Array.isArray(value) ? value.map((child, index) => renderNode(child, String(index))) : null; }
function asNode(value: unknown): RichNode | null { return value && typeof value === "object" && !Array.isArray(value) ? value as RichNode : null; }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
function textFrom(value: unknown): string { return Array.isArray(value) ? value.map((item) => { const node = asNode(item); return node?.type === "text" ? stringValue(node.text) : textFrom(node?.content); }).join("") : ""; }
function safeLink(value: unknown) { const url = stringValue(value); return /^(https?:\/\/|mailto:)/i.test(url) ? url : ""; }
function safeImageUrl(value: unknown) { const url = stringValue(value); return /^(https?:\/\/)/i.test(url) ? url : ""; }

function applyMarks(text: string, marks: unknown, key: string): ReactNode {
  let output: ReactNode = text;
  if (!Array.isArray(marks)) return output;
  for (const mark of marks) {
    const record = asRecord(mark);
    const type = stringValue(record.type);
    if (type === "bold") output = <strong key={`${key}-bold`}>{output}</strong>;
    if (type === "italic") output = <em key={`${key}-italic`}>{output}</em>;
    if (type === "strike") output = <s key={`${key}-strike`}>{output}</s>;
    if (type === "code") output = <code key={`${key}-code`} className="rounded bg-subtle px-1.5 py-0.5 text-[0.9em]">{output}</code>;
    if (type === "link") { const href = safeLink(asRecord(record.attrs).href); if (href) output = <a key={`${key}-link`} href={href} rel="noreferrer" className="text-accent underline">{output}</a>; }
  }
  return output;
}
