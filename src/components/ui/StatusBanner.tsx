type StatusBannerProps = {
  statusLabel: string;
  reasons: string[];
  tone: "danger" | "normal";
};

export const StatusBanner = ({ statusLabel, reasons, tone }: StatusBannerProps) => {
  return (
    <div className={`status status--${tone}`} role="status" aria-live="polite">
      <div className="status__title">STATUS: {statusLabel}</div>
      <div className="status__reasons">{reasons.join(" | ")}</div>
    </div>
  );
};
