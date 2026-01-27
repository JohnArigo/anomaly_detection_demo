export type MetricConfig = {
  key: string;
  label: string;
  tooltip: string;
};

export const coreMetrics: MetricConfig[] = [
  {
    key: "count_events",
    label: "Total Events",
    tooltip: "Total badge events recorded for the month.",
  },
  {
    key: "unique_devices",
    label: "Unique Devices",
    tooltip: "Number of distinct devices used during the month.",
  },
  {
    key: "time_of_day_stddev",
    label: "Time-of-Day Std Dev",
    tooltip: "Variation of badge times across the day.",
  },
  {
    key: "working_hours_count",
    label: "Working Hours Count",
    tooltip: "Events during typical working hours.",
  },
  {
    key: "off_hours_count",
    label: "Off-Hours Count",
    tooltip: "Events outside typical working hours.",
  },
  {
    key: "off_hours_ratio",
    label: "Off-Hours Ratio",
    tooltip: "Share of events outside typical working hours.",
  },
  {
    key: "weekend_count",
    label: "Weekend Count",
    tooltip: "Events recorded on weekends.",
  },
  {
    key: "weekend_ratio",
    label: "Weekend Ratio",
    tooltip: "Share of events recorded on weekends.",
  },
  {
    key: "rapid_scan_sequence_count",
    label: "Rapid Scans",
    tooltip: "Count of rapid badge scan sequences.",
  },
  {
    key: "denial_rate",
    label: "Denial Rate",
    tooltip: "Share of denied badge events.",
  },
  {
    key: "iforest_score",
    label: "Isolation Forest",
    tooltip: "Model score (higher = more normal).",
  },
];

export const driverMetricKeys = coreMetrics.map((metric) => metric.key);
