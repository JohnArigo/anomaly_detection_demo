export type Severity = "normal" | "watch" | "delinquent";

export const SEVERITY_THRESHOLDS = {
  watch: -0.15,
} as const;

export const getSeverityFromModel = (params: { isAnomaly: number; anomalyScore: number }): Severity => {
  if (params.isAnomaly === -1) return "delinquent";
  if (params.anomalyScore <= SEVERITY_THRESHOLDS.watch) return "watch";
  return "normal";
};

export const severityLabel = (severity: Severity) => {
  if (severity === "delinquent") return "DELINQUENT";
  if (severity === "watch") return "WATCH";
  return "NORMAL";
};

export const severityAriaLabel = (severity: Severity) =>
  `Severity ${severityLabel(severity).toLowerCase()}`;

export const severityToTone = (severity: Severity) => {
  if (severity === "delinquent") return "danger";
  if (severity === "watch") return "warning";
  return "neutral";
};

export const severityToKpiAccent = (severity: Severity) => {
  if (severity === "delinquent") return "danger";
  if (severity === "watch") return "warning";
  return "primary";
};

export const severityToStatusClass = (severity: Severity) => {
  if (severity === "delinquent") return "danger";
  if (severity === "watch") return "warning";
  return "normal";
};
