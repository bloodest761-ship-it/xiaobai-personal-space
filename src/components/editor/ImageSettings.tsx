"use client";

type ImageSettingsProps = {
  alt: string;
  caption: string;
  onAltChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onRemove: () => void;
};

export function ImageSettings({ alt, caption, onAltChange, onCaptionChange, onRemove }: ImageSettingsProps) {
  return (
    <section className="rounded-xl border border-border bg-page p-3" aria-label="图片设置">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-primary">图片设置</p>
        <button type="button" onClick={onRemove} className="text-xs font-medium text-red-700">从文章中移除图片</button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-secondary">
          替代文字
          <input value={alt} onChange={(event) => onAltChange(event.target.value)} placeholder="描述图片内容" className="field-input" />
        </label>
        <label className="grid gap-1 text-xs text-secondary">
          图片说明
          <input value={caption} onChange={(event) => onCaptionChange(event.target.value)} placeholder="显示在图片下方" className="field-input" />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">图片地址不可在此修改。移除只会删除文章中的图片节点，不会删除 Storage 原文件。</p>
    </section>
  );
}
