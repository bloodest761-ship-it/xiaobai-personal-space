import Image from "next/image";
import type { ReactNode } from "react";
import type { Json } from "@/types/database";

type RichContentProps = { content: Json };
type RichNode = { type?: unknown; text?: unknown; attrs?: unknown; marks?: unknown; content?: unknown };

export function RichContent({ content }: RichContentProps) {
  const root = asNode(content);
  if (!root || root.type !== "doc") return null;
  return <article className="content-typography rendered-content">{renderChildren(root.content)}</article>;
}

function renderNode(value: unknown, key: string): ReactNode {
  const node = asNode(value);
  if (!node) return null;
  const children = renderChildren(node.content);

  if (node.type === "text") return <span key={key}>{applyMarks(String(node.text ?? ""), node.marks, key)}</span>;
  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading") return asRecord(node.attrs).level === 2 ? <h2 key={key}>{children}</h2> : asRecord(node.attrs).level === 3 ? <h3 key={key}>{children}</h3> : <p key={key}>{children}</p>;
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") return <ol key={key}>{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "codeBlock") return <pre key={key}><code>{textFrom(node.content)}</code></pre>;
  if (node.type === "horizontalRule") return <hr key={key} />;
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
  return <figure key={key} className="content-image"><Image src={src} alt={alt} width={1200} height={800} className="h-auto w-full object-cover" />{caption ? <figcaption>{caption}</figcaption> : null}</figure>;
}

function renderCallout(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  const type = ["tip", "warning", "conclusion"].includes(stringValue(attrs.type)) ? stringValue(attrs.type) : "tip";
  const labels: Record<string, string> = { tip: "提示", warning: "注意", conclusion: "结论" };
  return <aside key={key} className={`content-block callout-block callout-block--${type}`}><p className="content-block__title">{labels[type]}</p><p>{stringValue(attrs.content)}</p></aside>;
}

function renderInsight(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  return (
    <section key={key} className="content-block insight-block">
      <h2 className="content-block__title">认知变化</h2>
      <dl className="insight-block__grid">
        <Definition label="过去我认为" value={stringValue(attrs.past)} showEmpty />
        <Definition label="现在我认为" value={stringValue(attrs.present)} showEmpty />
        <Definition label="改变的原因" value={stringValue(attrs.reason)} showEmpty />
      </dl>
    </section>
  );
}

function renderProjectOverview(node: RichNode, key: string) {
  const attrs = asRecord(node.attrs);
  const repositoryUrl = safeLink(attrs.repositoryUrl);
  const status = stringValue(attrs.projectStatus);
  const techStack = stringValue(attrs.techStack);
  const timeline = stringValue(attrs.timeline);
  const hasFields = Boolean(status || techStack || timeline || repositoryUrl);
  return (
    <section key={key} className="content-block project-overview-block">
      <h2 className="content-block__title">项目概览</h2>
      {hasFields ? <dl className="project-overview-block__grid">
        <Definition label="项目状态" value={status} />
        <Definition label="技术栈" value={techStack} />
        <Definition label="时间" value={timeline} />
        {repositoryUrl ? <div><dt>仓库地址</dt><dd><a href={repositoryUrl} target="_blank" rel="noreferrer">{repositoryUrl}</a></dd></div> : null}
      </dl> : null}
    </section>
  );
}

function Definition({ label, value, showEmpty = false }: { label: string; value: string; showEmpty?: boolean }) {
  if (!value && !showEmpty) return null;
  return <div><dt>{label}</dt><dd>{value || "未填写"}</dd></div>;
}

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
    if (type === "code") output = <code key={`${key}-code`}>{output}</code>;
    if (type === "link") {
      const href = safeLink(asRecord(record.attrs).href);
      if (href) output = <a key={`${key}-link`} href={href} target="_blank" rel="noreferrer">{output}</a>;
    }
  }
  return output;
}
