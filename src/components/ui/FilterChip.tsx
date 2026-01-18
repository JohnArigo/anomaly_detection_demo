import type { ReactNode } from "react";

type FilterChipProps = {
  label: ReactNode;
  tone?: "neutral" | "active";
  onRemove?: () => void;
};

export const FilterChip = ({ label, tone = "neutral", onRemove }: FilterChipProps) => {
  return (
    <span className={`chip chip--${tone}`}>
      <span className="chip__label">{label}</span>
      {onRemove && (
        <button type="button" className="chip__remove" onClick={onRemove} aria-label="Remove filter">
          x
        </button>
      )}
    </span>
  );
};
