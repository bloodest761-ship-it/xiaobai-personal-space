"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EditorImage } from "@/components/editor/types";

const maxFileSize = 8 * 1024 * 1024;
const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadStatus = "idle" | "uploading" | "success" | "error";

function readableUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/^[\u4e00-\u9fff]/.test(message)) return message;
  if (/network|fetch|timeout/i.test(message)) return "网络连接异常，图片未上传成功，请检查网络后重试。";
  if (/permission|not authorized|row-level/i.test(message)) return "没有上传权限，请确认当前管理员登录状态。";
  return "图片上传失败，请稍后重试。";
}

type ImageUploaderProps = {
  entryId: string;
  onUploaded: (image: EditorImage) => void;
  onBeforeChoose: () => void;
};

export type ImageUploaderHandle = {
  open: () => void;
};

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader({ entryId, onUploaded, onBeforeChoose }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isUploading = status === "uploading";

  function openFilePicker() {
    if (uploadInProgress.current) return;
    onBeforeChoose();
    inputRef.current?.click();
  }

  useImperativeHandle(ref, () => ({
    open() {
      openFilePicker();
    },
  }));

  function validateFile(file: File) {
    if (!fileExtensions[file.type]) return "仅支持 JPG、JPEG、PNG 或 WEBP 格式的图片，不支持 SVG 或其他文件。";
    if (file.size > maxFileSize) return "图片大小不能超过 8MB，请选择更小的图片后重试。";
    return null;
  }

  function chooseFile(file?: File) {
    if (!file || uploadInProgress.current) return;
    const validationError = validateFile(file);
    setSelectedFile(file);
    setMessage(validationError);
    setStatus(validationError ? "error" : "idle");
    if (!validationError) void upload(file);
  }

  async function upload(file: File) {
    if (uploadInProgress.current) return;

    const validationError = validateFile(file);
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }

    uploadInProgress.current = true;
    setStatus("uploading");
    setMessage("正在上传图片……");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData.user;

      if (userError || !user) throw new Error("请先登录后再上传图片。");

      const { data: admin, error: adminError } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError || !admin) throw new Error("只有管理员可以上传图片。");

      const extension = fileExtensions[file.type];
      const path = `${user.id}/${entryId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("content-images").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("content-images").getPublicUrl(path);
      if (!urlData.publicUrl) throw new Error("图片地址生成失败，请重试。");

      onUploaded({ src: urlData.publicUrl, alt: alt.trim(), caption: caption.trim() });
      setStatus("success");
      setMessage(`已插入图片：${file.name}`);
      setSelectedFile(null);
      setAlt("");
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setStatus("error");
      setMessage(`上传失败：${readableUploadError(error)}`);
    } finally {
      uploadInProgress.current = false;
    }
  }

  return (
    <section className="rounded-xl border border-border bg-page p-3" aria-label="插入图片">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-primary">插入图片</p>
        <span className="text-xs text-muted">JPG / PNG / WEBP，最大 8MB</span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-secondary">
          替代文字 <span className="text-muted">（建议填写）</span>
          <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="描述图片内容" className="field-input" disabled={isUploading} />
        </label>
        <label className="grid gap-1 text-xs text-secondary">
          图片说明 <span className="text-muted">（可选）</span>
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="显示在图片下方" className="field-input" disabled={isUploading} />
        </label>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => chooseFile(event.target.files?.[0])}
        className="sr-only"
        disabled={isUploading}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={openFilePicker} disabled={isUploading} className="min-h-9 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60">
          {isUploading ? "正在上传图片……" : "选择图片"}
        </button>
        {status === "error" && selectedFile ? <button type="button" onClick={() => void upload(selectedFile)} disabled={isUploading} className="min-h-9 rounded-full px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-60">重试上传</button> : null}
        {message ? <span role={status === "error" ? "alert" : "status"} className={`text-xs ${status === "error" ? "text-red-700" : status === "success" ? "text-emerald-700" : "text-secondary"}`}>{message}</span> : null}
      </div>
    </section>
  );
});
