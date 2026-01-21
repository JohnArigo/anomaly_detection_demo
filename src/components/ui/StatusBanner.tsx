import { severityLabel, severityToStatusClass, type Severity } from "../../utils/severity";

type StatusBannerProps = {
  severity: Severity;
  reasons: string[];
};

export const StatusBanner = ({ severity, reasons }: StatusBannerProps) => {
  const statusClass = severityToStatusClass(severity);
  const label = severityLabel(severity);
  return (
    <div className={`status status--${statusClass}`} role="status" aria-live="polite">
      <div className="status__title">STATUS: {label}</div>
      <div className="status__reasons">{reasons.join(" | ")}</div>
    </div>
  );
};
