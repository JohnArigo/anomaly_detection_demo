import { type ReactNode } from "react";

type ScreenHeaderProps = {
  title: ReactNode;
  meta: ReactNode[];
};

export const ScreenHeader = ({ title, meta }: ScreenHeaderProps) => {
  return (
    <div className="screen-header">
      <div className="screen-header__title">{title}</div>
      <div className="screen-header__meta">
        {meta.map((item, index) => (
          <span key={`meta-${index}`} className="screen-header__metaItem">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
