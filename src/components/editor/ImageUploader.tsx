"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EditorImage } from "@/components/editor/types";

const maxFileSize = 5 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ImageUploaderProps = {
  entryId: string;
  onUploaded: (image: EditorImage) => void;
};

export type ImageUploaderHandle = {
  open: () => void;
};

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader({ entryId, onUploaded }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open() {
      inputRef.current?.click();
    },
  }));

  async function upload(file?: File) {
    if (!file) return;
    setError(null);

    if (!acceptedTypes.has(file.type)) {
      setStatus("error");
      setError("仅支持 JPG、PNG 或 WebP 图片。");
      return;
    }

    if (file.size > maxFileSize) {
      setStatus("error");
      setError("图片不能超过 5MB。");
      return;
    }

    setStatus("uploading");
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setStatus("error");
      setError("请先登录后再上传图片。");
      return;
    }

    const { data: admin } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      setStatus("error");
      setError("只有管理员可以上传图片。");
      return;
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${user.id}/${entryId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("content-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      setStatus("error");
      setError(uploadError.message || "上传失败，请重试。");
      return;
    }

    const { data: urlData } = supabase.storage.from("content-images").getPublicUrl(path);
    onUploaded({ src: urlData.publicUrl, alt: alt.trim(), caption: caption.trim() });
    setStatus("success");
    setAlt("");
    setCaption("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-page p-3">
      <p className="text-xs font-medium text-primary">插入图片</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="图片 alt" className="field-input" />
        <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="图片说明" className="field-input" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} className="max-w-full text-xs text-secondary" />
        {status === "uploading" ? <span className="text-xs text-secondary">上传中...</span> : null}
        {status === "success" ? <span className="text-xs text-emerald-700">上传成功，已插入编辑器。</span> : null}
        {error ? <span className="text-xs text-red-700">{error}</span> : null}
      </div>
    </div>
  );
});
