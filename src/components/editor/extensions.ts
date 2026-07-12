import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

function readAttribute(element: HTMLElement, name: string, fallback = "") {
  return element.getAttribute(name) ?? fallback;
}

export const TrailingParagraph = Extension.create({
  name: "trailingParagraph",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (_transactions, _oldState, state) => {
          const paragraph = state.schema.nodes.paragraph;
          if (!paragraph || state.doc.lastChild?.type === paragraph) return null;
          return state.tr.insert(state.doc.content.size, paragraph.create());
        },
      }),
    ];
  },
});

export const Callout = Node.create({
  name: "callout",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { type: { default: "tip" }, content: { default: "" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-editor-node="callout"]', getAttrs: (element) => ({ type: readAttribute(element as HTMLElement, "data-callout-type", "tip"), content: readAttribute(element as HTMLElement, "data-callout-content") }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const { type, content } = HTMLAttributes;
    return ["div", mergeAttributes({ "data-editor-node": "callout", "data-callout-type": type, "data-callout-content": content }, HTMLAttributes), `${type === "warning" ? "注意" : type === "conclusion" ? "结论" : "提示"}：${content}`];
  },
});

export const InsightShift = Node.create({
  name: "insightShift",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { past: { default: "" }, present: { default: "" }, reason: { default: "" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-editor-node="insightShift"]', getAttrs: (element) => ({ past: readAttribute(element as HTMLElement, "data-insight-past"), present: readAttribute(element as HTMLElement, "data-insight-present"), reason: readAttribute(element as HTMLElement, "data-insight-reason") }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const { past, present, reason } = HTMLAttributes;
    return ["div", mergeAttributes({ "data-editor-node": "insightShift", "data-insight-past": past, "data-insight-present": present, "data-insight-reason": reason }, HTMLAttributes), `认知变化：过去我认为 ${past}；现在我认为 ${present}；为什么改变：${reason}`];
  },
});

export const ProjectOverview = Node.create({
  name: "projectOverview",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { projectStatus: { default: "idea" }, techStack: { default: "" }, timeline: { default: "" }, repositoryUrl: { default: "" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-editor-node="projectOverview"]', getAttrs: (element) => ({ projectStatus: readAttribute(element as HTMLElement, "data-project-status", "idea"), techStack: readAttribute(element as HTMLElement, "data-project-tech-stack"), timeline: readAttribute(element as HTMLElement, "data-project-timeline"), repositoryUrl: readAttribute(element as HTMLElement, "data-project-repository-url") }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const { projectStatus, techStack, timeline, repositoryUrl } = HTMLAttributes;
    return ["div", mergeAttributes({ "data-editor-node": "projectOverview", "data-project-status": projectStatus, "data-project-tech-stack": techStack, "data-project-timeline": timeline, "data-project-repository-url": repositoryUrl }, HTMLAttributes), `项目概览：${projectStatus}；${techStack}；${timeline}；${repositoryUrl}`];
  },
});

export const ImageFigure = Node.create({
  name: "imageFigure",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { src: { default: "" }, alt: { default: "" }, caption: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "figure[data-editor-image]", getAttrs: (element) => ({ src: readAttribute(element as HTMLElement, "data-image-src"), alt: readAttribute(element as HTMLElement, "data-image-alt"), caption: readAttribute(element as HTMLElement, "data-image-caption") }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, ...figureAttributes } = HTMLAttributes;
    return ["figure", mergeAttributes({ "data-editor-image": "true", "data-image-src": src, "data-image-alt": alt, "data-image-caption": caption }, figureAttributes), ["img", { src, alt }], ...(caption ? [["figcaption", {}, caption]] : [])];
  },
});
