type TagProps = {
  children: string;
};

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary">
      {children}
    </span>
  );
}
