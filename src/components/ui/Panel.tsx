import { type ReactNode } from "react";

type PanelProps = {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Panel = ({
  title,
  headerRight,
  children,
  className,
}: PanelProps) => {
  return (
    <section className={`panel ${className ?? ""}`.trim()}>
      {(title || headerRight) && (
        <div className="panel__header">
          {title && <h3 className="panel__title">{title}</h3>}
          {headerRight && (
            <div className="panel__headerRight">{headerRight}</div>
          )}
        </div>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
};
