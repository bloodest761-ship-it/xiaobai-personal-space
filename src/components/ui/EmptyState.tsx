type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <p className="mx-auto mt-3 max-w-reading text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
