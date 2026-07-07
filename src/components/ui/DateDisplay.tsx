import { formatDate } from "@/lib/dates";

type DateDisplayProps = {
  publishedAt?: string;
  updatedAt?: string;
  startedAt?: string;
};

export function DateDisplay({ publishedAt, updatedAt, startedAt }: DateDisplayProps) {
  const items = [
    startedAt ? `开始于 ${formatDate(startedAt)}` : null,
    publishedAt ? `发布于 ${formatDate(publishedAt)}` : null,
    updatedAt ? `更新于 ${formatDate(updatedAt)}` : null,
  ].filter(Boolean);

  return (
    <p className="text-sm leading-6 text-muted">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? " · " : ""}
          {item}
        </span>
      ))}
    </p>
  );
}
