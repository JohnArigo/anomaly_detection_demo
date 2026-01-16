type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {description && <div className="empty__description">{description}</div>}
    </div>
  );
};
