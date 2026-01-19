import type { ReactNode, Ref } from "react";
import type { KpiId } from "../../data/kpis";
import { kpiDefinitions } from "../../data/kpis";
import { Tooltip } from "./Tooltip";

type KpiTileProps = {
  kpiId: KpiId;
  value: ReactNode;
  sublabel?: ReactNode;
  accent?: "primary" | "warning" | "danger" | "success";
  comparison?: string;
  onActivate?: () => void;
  ariaLabel?: string;
  tileRef?: Ref<HTMLDivElement>;
};

export const KpiTile = ({
  kpiId,
  value,
  sublabel,
  accent = "primary",
  comparison,
  onActivate,
  ariaLabel,
  tileRef,
}: KpiTileProps) => {
  const definition = kpiDefinitions[kpiId];
  const isInteractive = Boolean(onActivate);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      ref={tileRef}
      className={`kpi kpi--${accent} ${isInteractive ? "kpi--interactive" : ""}`.trim()}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? ariaLabel ?? definition.label : undefined}
      onClick={isInteractive ? onActivate : undefined}
      onKeyDown={isInteractive ? onKeyDown : undefined}
    >
      <div className="kpi__header">
        <div className="kpi__label">{definition.label}</div>
        <Tooltip
          label={`${definition.label} details`}
          content={
            <div className="tooltip__content">
              <div className="tooltip__section">
                <div className="tooltip__title">Meaning</div>
                <div className="tooltip__text">{definition.meaning}</div>
              </div>
              <div className="tooltip__section">
                <div className="tooltip__title">Calculation</div>
                <div className="tooltip__text">{definition.calculation}</div>
                <div className="tooltip__formula">{definition.formula}</div>
              </div>
              <div className="tooltip__section">
                <div className="tooltip__title">Interpretation</div>
                <div className="tooltip__text">{definition.interpretation}</div>
              </div>
              {comparison && (
                <div className="tooltip__section">
                  <div className="tooltip__title">Compared to org avg</div>
                  <div className="tooltip__text">{comparison}</div>
                </div>
              )}
            </div>
          }
        />
      </div>
      <div className="kpi__value">{value}</div>
      {sublabel && <div className="kpi__sublabel">{sublabel}</div>}
    </div>
  );
};
