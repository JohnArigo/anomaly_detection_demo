import type { ReactNode } from "react";
import type { KpiId } from "../../data/kpis";
import { kpiDefinitions } from "../../data/kpis";
import { Tooltip } from "./Tooltip";

type KpiTileProps = {
  kpiId: KpiId;
  value: ReactNode;
  sublabel?: ReactNode;
  accent?: "primary" | "warning" | "danger" | "success";
  comparison?: string;
};

export const KpiTile = ({ kpiId, value, sublabel, accent = "primary", comparison }: KpiTileProps) => {
  const definition = kpiDefinitions[kpiId];

  return (
    <div className={`kpi kpi--${accent}`}>
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
