type StatusBannerProps = {
  status: string;
  reasons: string[];
};

export const StatusBanner = ({ status, reasons }: StatusBannerProps) => {
  const severity = status === "DELINQUENT" ? "danger" : "warning";
  return (
    <div className={`status status--${severity}`} role="status" aria-live="polite">
      <div className="status__title">STATUS: {status}</div>
      <div className="status__reasons">{reasons.join(" | ")}</div>
    </div>
  );
};
