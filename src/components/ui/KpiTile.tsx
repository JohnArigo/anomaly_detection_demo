import { type ReactNode } from "react";

type KpiTileProps = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  accent?: "primary" | "warning" | "danger" | "success";
};

export const KpiTile = ({
  label,
  value,
  sublabel,
  accent = "primary",
}: KpiTileProps) => {
  return (
    <div className={`kpi kpi--${accent}`}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {sublabel && <div className="kpi__sublabel">{sublabel}</div>}
    </div>
  );
};
