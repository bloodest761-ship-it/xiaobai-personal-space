"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";

type EditorToolbarProps = {
  editor: Editor;
  isProject: boolean;
  onAction: () => void;
  onLink: () => void;
  onImage: () => void;
  onCallout: () => void;
  onInsight: () => void;
  onProjectOverview: () => void;
};

export function EditorToolbar({
  editor,
  isProject,
  onAction,
  onLink,
  onImage,
  onCallout,
  onInsight,
  onProjectOverview,
}: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => ({
      paragraph: activeEditor.isActive("paragraph"),
      h2: activeEditor.isActive("heading", { level: 2 }),
      h3: activeEditor.isActive("heading", { level: 3 }),
      bold: activeEditor.isActive("bold"),
      italic: activeEditor.isActive("italic"),
      strike: activeEditor.isActive("strike"),
      code: activeEditor.isActive("code"),
      bulletList: activeEditor.isActive("bulletList"),
      orderedList: activeEditor.isActive("orderedList"),
      blockquote: activeEditor.isActive("blockquote"),
      codeBlock: activeEditor.isActive("codeBlock"),
      link: activeEditor.isActive("link"),
      canUndo: activeEditor.can().undo(),
      canRedo: activeEditor.can().redo(),
    }),
  });

  const run = (action: () => void) => {
    onAction();
    action();
    editor.commands.focus();
  };

  return (
    <div className="editor-toolbar sticky top-20 z-10 -mx-1 overflow-x-auto rounded-xl border border-border bg-surface/95 p-2 shadow-sm backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="编辑器工具栏">
      <div className="flex w-max items-stretch gap-1">
        <ToolbarGroup label="文本类型">
          <ToolbarButton label="正文" hint="普通正文" active={state.paragraph} onClick={() => run(() => editor.chain().focus().setParagraph().run())} />
          <ToolbarButton label="H2" hint="二级标题" active={state.h2} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} />
          <ToolbarButton label="H3" hint="三级标题" active={state.h3} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} />
        </ToolbarGroup>
        <ToolbarGroup label="文字格式">
          <ToolbarButton label="加粗" hint="加粗 Ctrl+B" active={state.bold} onClick={() => run(() => editor.chain().focus().toggleBold().run())} />
          <ToolbarButton label="斜体" hint="斜体 Ctrl+I" active={state.italic} onClick={() => run(() => editor.chain().focus().toggleItalic().run())} />
          <ToolbarButton label="删除线" hint="删除线" active={state.strike} onClick={() => run(() => editor.chain().focus().toggleStrike().run())} />
          <ToolbarButton label="行内代码" hint="行内代码" active={state.code} onClick={() => run(() => editor.chain().focus().toggleCode().run())} />
        </ToolbarGroup>
        <ToolbarGroup label="结构">
          <ToolbarButton label="无序列表" hint="无序列表" active={state.bulletList} onClick={() => run(() => editor.chain().focus().toggleBulletList().run())} />
          <ToolbarButton label="有序列表" hint="有序列表" active={state.orderedList} onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())} />
          <ToolbarButton label="引用" hint="引用" active={state.blockquote} onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())} />
          <ToolbarButton label="代码块" hint="代码块" active={state.codeBlock} onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())} />
          <ToolbarButton label="分割线" hint="插入分割线" onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())} />
        </ToolbarGroup>
        <ToolbarGroup label="插入">
          <ToolbarButton label="链接" hint="插入或编辑链接" active={state.link} onClick={() => run(onLink)} />
          <ToolbarButton label="图片" hint="选择图片并插入" onClick={onImage} />
          <ToolbarButton label="提示块" hint="插入提示块" onClick={() => run(onCallout)} />
          <ToolbarButton label="认知变化" hint="插入认知变化块" onClick={() => run(onInsight)} />
          {isProject ? <ToolbarButton label="项目概览" hint="插入项目概览块" onClick={() => run(onProjectOverview)} /> : null}
        </ToolbarGroup>
        <ToolbarGroup label="历史" last>
          <ToolbarButton label="撤销" hint="撤销 Ctrl+Z" disabled={!state.canUndo} onClick={() => run(() => editor.chain().focus().undo().run())} />
          <ToolbarButton label="重做" hint="重做 Ctrl+Shift+Z" disabled={!state.canRedo} onClick={() => run(() => editor.chain().focus().redo().run())} />
        </ToolbarGroup>
      </div>
    </div>
  );
}

function ToolbarGroup({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return <div role="group" aria-label={label} className={`flex shrink-0 items-center gap-1 px-1 ${last ? "" : "border-r border-border pr-2"}`}>{children}</div>;
}

function ToolbarButton({ label, hint, active = false, disabled = false, onClick }: { label: string; hint: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={hint}
      aria-pressed={active || undefined}
      title={hint}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-accent bg-accent-soft font-semibold text-primary shadow-sm" : "border-transparent text-secondary hover:border-border hover:bg-page hover:text-primary"}`}
    >
      {label}
    </button>
  );
}
