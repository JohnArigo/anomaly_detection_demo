export type KpiId =
  | "iforestScore"
  | "denialRate"
  | "offHoursRatio"
  | "weekendRatio"
  | "countEvents";

export type KpiDefinition = {
  id: KpiId;
  label: string;
  shortLabel?: string;
  format: "percent" | "number";
  precision: number;
  meaning: string;
  calculation: string;
  formula: string;
  interpretation: string;
};

export const kpiDefinitions: Record<KpiId, KpiDefinition> = {
  iforestScore: {
    id: "iforestScore",
    label: "Isolation Forest",
    format: "number",
    precision: 3,
    meaning: "Model score where higher values indicate more typical behavior.",
    calculation: "Direct model output from isolation forest.",
    formula: "iforest_score",
    interpretation: "Lower values indicate more unusual patterns.",
  },
  denialRate: {
    id: "denialRate",
    label: "Denial Rate",
    format: "percent",
    precision: 1,
    meaning: "Share of badge attempts that were denied.",
    calculation: "Denied_count / count_events.",
    formula: "denial_rate",
    interpretation: "Higher rates can indicate access issues or anomalies.",
  },
  offHoursRatio: {
    id: "offHoursRatio",
    label: "Off-Hours Ratio",
    format: "percent",
    precision: 1,
    meaning: "Share of events outside normal working hours.",
    calculation: "off_hours_count / count_events.",
    formula: "off_hours_ratio",
    interpretation: "Higher values indicate more after-hours activity.",
  },
  weekendRatio: {
    id: "weekendRatio",
    label: "Weekend Ratio",
    format: "percent",
    precision: 1,
    meaning: "Share of events on weekends.",
    calculation: "weekend_count / count_events.",
    formula: "weekend_ratio",
    interpretation: "Higher values indicate more weekend activity.",
  },
  countEvents: {
    id: "countEvents",
    label: "Total Events",
    format: "number",
    precision: 0,
    meaning: "Total badge events recorded this month.",
    calculation: "Sum of all badge events.",
    formula: "count_events",
    interpretation: "Higher counts indicate higher activity volume.",
  },
};
