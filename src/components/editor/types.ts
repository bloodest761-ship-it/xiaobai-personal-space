import type { JSONContent } from "@tiptap/core";

export type EditorDocument = JSONContent;

export type EditorImage = {
  src: string;
  alt: string;
  caption: string;
};

export const emptyEditorDocument: EditorDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function editorDocumentToText(value: EditorDocument): string {
  const pieces: string[] = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;

    if (typeof record.text === "string") pieces.push(record.text);

    const attrs = record.attrs;
    if (attrs && typeof attrs === "object") {
      const attrRecord = attrs as Record<string, unknown>;
      for (const key of ["content", "past", "present", "reason", "caption", "alt", "techStack"]) {
        if (typeof attrRecord[key] === "string") pieces.push(attrRecord[key]);
      }
    }

    if (Array.isArray(record.content)) record.content.forEach(visit);
  };

  visit(value);
  return pieces.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function isEditorDocument(value: unknown): value is EditorDocument {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
