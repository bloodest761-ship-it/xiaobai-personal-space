"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { Callout, ImageFigure, InsightShift, ProjectOverview, TrailingParagraph } from "@/components/editor/extensions";
import { ImageUploader, type ImageUploaderHandle } from "@/components/editor/ImageUploader";
import { editorDocumentToText, emptyEditorDocument, isEditorDocument, type EditorDocument, type EditorImage } from "@/components/editor/types";

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
  const imageUploader = useRef<ImageUploaderHandle>(null);
  const markUserInteraction = () => { hasUserInteractionRef.current = true; };
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
        class: "content-typography editor-writing-surface min-h-80 rounded-xl border border-border bg-page px-5 py-5 text-primary outline-none transition focus:border-accent",
        "data-placeholder": "从这里开始记录你的想法……",
      },
      handleDOMEvents: {
        beforeinput: () => { markUserInteraction(); return false; },
        input: () => { markUserInteraction(); return false; },
        paste: () => { markUserInteraction(); return false; },
        compositionend: () => { markUserInteraction(); return false; },
      },
    },
    onUpdate({ editor: activeEditor }) {
      if (!hasUserInteractionRef.current) return;
      const json = activeEditor.getJSON() as EditorDocument;
      onChange(json, editorDocumentToText(json));
    },
  });

  useEffect(() => {
    if (!editor || resetVersion === 0) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor, resetVersion]);

  useEffect(() => {
    if (editor) onEditorReady(editor);
  }, [editor, onEditorReady]);

  if (!editor) {
    return <div className="min-h-80 rounded-xl border border-border bg-page p-5 text-sm text-muted">正在加载编辑器…</div>;
  }
  const activeEditor = editor;

  function setLink() {
    markUserInteraction();
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
    markUserInteraction();
    const contentText = window.prompt("提示块内容", "") ?? "";
    const type = window.prompt("类型：tip、warning 或 conclusion", "tip") ?? "tip";
    activeEditor.chain().focus().insertContent({ type: "callout", attrs: { content: contentText, type } }).run();
  }

  function addInsight() {
    markUserInteraction();
    const past = window.prompt("过去我认为", "") ?? "";
    const present = window.prompt("现在我认为", "") ?? "";
    const reason = window.prompt("为什么改变", "") ?? "";
    activeEditor.chain().focus().insertContent({ type: "insightShift", attrs: { past, present, reason } }).run();
  }

  function addProjectOverview() {
    markUserInteraction();
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
    markUserInteraction();
    activeEditor.chain().focus().insertContent({ type: "imageFigure", attrs: image }).run();
  }

  return (
    <div className="grid gap-3">
      <EditorToolbar
        editor={activeEditor}
        isProject={isProject}
        onAction={markUserInteraction}
        onLink={setLink}
        onImage={() => imageUploader.current?.open()}
        onCallout={addCallout}
        onInsight={addInsight}
        onProjectOverview={addProjectOverview}
      />
      <div className="editor-supporting-controls"><ImageUploader ref={imageUploader} entryId={entryId} onUploaded={insertImage} /></div>
      <EditorContent editor={editor} />
      <p className="text-xs leading-5 text-muted">图片节点删除时只会从文章 JSON 移除，不会自动删除 Storage 原文件。</p>
    </div>
  );
}
