"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Callout, ImageFigure, InsightShift, ProjectOverview, TrailingParagraph } from "@/components/editor/extensions";
import { editorDocumentToText, emptyEditorDocument, isEditorDocument, type EditorDocument, type EditorImage } from "@/components/editor/types";
import { ImageUploader } from "@/components/editor/ImageUploader";

type RichTextEditorProps = {
  entryId: string;
  content: EditorDocument;
  resetVersion: number;
  isProject: boolean;
  onChange: (json: EditorDocument, text: string) => void;
  onEditorReady: (editor: Editor) => void;
};

export function RichTextEditor({ entryId, content, resetVersion, isProject, onChange, onEditorReady }: RichTextEditorProps) {
  const hasUserInteractionRef = useRef(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      ImageFigure,
      Callout,
      InsightShift,
      ProjectOverview,
      TrailingParagraph,
    ],
    content: isEditorDocument(content) ? content : emptyEditorDocument,
    editorProps: {
      attributes: {
        class: "min-h-80 rounded-xl border border-border bg-page px-5 py-4 text-primary outline-none focus:border-accent",
      },
      handleDOMEvents: {
        beforeinput: () => { hasUserInteractionRef.current = true; return false; },
        input: () => { hasUserInteractionRef.current = true; return false; },
        paste: () => { hasUserInteractionRef.current = true; return false; },
      },
    },
    onUpdate({ editor: activeEditor }) {
      if (!hasUserInteractionRef.current) return;
      const json = activeEditor.getJSON() as EditorDocument;
      onChange(json, editorDocumentToText(json));
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (resetVersion > 0) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor, resetVersion]);

  useEffect(() => {
    if (editor) onEditorReady(editor);
  }, [editor, onEditorReady]);

  if (!editor) return <div className="min-h-80 rounded-xl border border-border bg-page p-5 text-sm text-muted">正在加载编辑器...</div>;
  const activeEditor = editor;

  function setLink() {
    hasUserInteractionRef.current = true;
    const previous = activeEditor.getAttributes("link").href as string | undefined;
    const href = window.prompt("输入链接地址", previous ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function addCallout() {
    hasUserInteractionRef.current = true;
    const contentText = window.prompt("提示块内容", "") ?? "";
    const type = window.prompt("类型：tip、warning 或 conclusion", "tip") ?? "tip";
    activeEditor.chain().focus().insertContent({ type: "callout", attrs: { content: contentText, type } }).run();
  }

  function addInsight() {
    hasUserInteractionRef.current = true;
    const past = window.prompt("过去我认为", "") ?? "";
    const present = window.prompt("现在我认为", "") ?? "";
    const reason = window.prompt("为什么改变", "") ?? "";
    activeEditor.chain().focus().insertContent({ type: "insightShift", attrs: { past, present, reason } }).run();
  }

  function addProjectOverview() {
    hasUserInteractionRef.current = true;
    const projectStatus = window.prompt("项目状态", "idea") ?? "idea";
    const techStack = window.prompt("技术栈（逗号分隔）", "") ?? "";
    const timeline = window.prompt("时间", "") ?? "";
    const repositoryUrl = window.prompt("仓库地址", "") ?? "";
    activeEditor.chain().focus().insertContent({
      type: "projectOverview",
      attrs: { projectStatus, techStack, timeline, repositoryUrl },
    }).run();
  }

  function insertImage(image: EditorImage) {
    hasUserInteractionRef.current = true;
    activeEditor.chain().focus().insertContent({ type: "imageFigure", attrs: image }).run();
  }

  const buttonClass = "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary hover:border-accent hover:text-primary disabled:opacity-40";
  const activeClass = "border-accent text-accent";

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3" aria-label="富文本工具栏">
        <ToolbarButton label="段落" active={activeEditor.isActive("paragraph")} onClick={() => { hasUserInteractionRef.current = true; activeEditor.chain().focus().setParagraph().run(); }} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="H2" active={activeEditor.isActive("heading", { level: 2 })} onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="H3" active={activeEditor.isActive("heading", { level: 3 })} onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="加粗" active={activeEditor.isActive("bold")} onClick={() => activeEditor.chain().focus().toggleBold().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="斜体" active={activeEditor.isActive("italic")} onClick={() => activeEditor.chain().focus().toggleItalic().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="删除线" active={activeEditor.isActive("strike")} onClick={() => activeEditor.chain().focus().toggleStrike().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="无序列表" active={activeEditor.isActive("bulletList")} onClick={() => activeEditor.chain().focus().toggleBulletList().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="有序列表" active={activeEditor.isActive("orderedList")} onClick={() => activeEditor.chain().focus().toggleOrderedList().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="引用" active={activeEditor.isActive("blockquote")} onClick={() => activeEditor.chain().focus().toggleBlockquote().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="行内代码" active={activeEditor.isActive("code")} onClick={() => activeEditor.chain().focus().toggleCode().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton label="代码块" active={activeEditor.isActive("codeBlock")} onClick={() => activeEditor.chain().focus().toggleCodeBlock().run()} className={buttonClass} activeClass={activeClass} />
        <button type="button" onClick={() => activeEditor.chain().focus().setHorizontalRule().run()} className={buttonClass}>分割线</button>
        <ToolbarButton label="链接" active={activeEditor.isActive("link")} onClick={setLink} className={buttonClass} activeClass={activeClass} />
        <button type="button" onClick={addCallout} className={buttonClass}>提示块</button>
        <button type="button" onClick={addInsight} className={buttonClass}>认知变化</button>
        {isProject ? <button type="button" onClick={addProjectOverview} className={buttonClass}>项目概览</button> : null}
        <button type="button" onClick={() => activeEditor.chain().focus().undo().run()} disabled={!activeEditor.can().undo()} className={buttonClass}>撤销</button>
        <button type="button" onClick={() => activeEditor.chain().focus().redo().run()} disabled={!activeEditor.can().redo()} className={buttonClass}>重做</button>
      </div>
      <ImageUploader entryId={entryId} onUploaded={insertImage} />
      <EditorContent editor={activeEditor} />
      <p className="text-xs leading-5 text-muted">图片节点删除时只会从文章 JSON 移除；依照 V0.1 规则不会自动删除 Storage 原文件，以避免误删。</p>
    </div>
  );
}

function ToolbarButton({ label, active, onClick, className, activeClass }: { label: string; active: boolean; onClick: () => void; className: string; activeClass: string }) {
  return <button type="button" onClick={onClick} className={`${className} ${active ? activeClass : ""}`}>{label}</button>;
}
