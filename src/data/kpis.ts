export type KpiId =
  | "anomalyScore"
  | "isolationForest"
  | "shannonEntropy"
  | "deniedRate"
  | "afterHoursRate"
  | "weekendRate"
  | "uniqueDeviceRatio";

export type KpiDefinition = {
  id: KpiId;
  label: string;
  shortLabel?: string;
  format: "percent" | "number" | "ratio";
  precision: number;
  meaning: string;
  calculation: string;
  formula: string;
  interpretation: string;
  thresholds?: { low: number; medium: number; high: number };
};

export const kpiDefinitions: Record<KpiId, KpiDefinition> = {
  anomalyScore: {
    id: "anomalyScore",
    label: "Anomaly Score",
    format: "number",
    precision: 0,
    meaning: "Composite risk indicator derived from multiple badge behavior signals.",
    calculation: "Weighted blend of denial rate, entropy, after-hours, new locations, and device variance.",
    formula: "score = normalize(weightedFactors) * 100",
    interpretation: "Higher scores indicate more unusual or higher-risk access patterns.",
    thresholds: { low: 0, medium: 60, high: 75 },
  },
  isolationForest: {
    id: "isolationForest",
    label: "Isolation Forest",
    format: "number",
    precision: 2,
    meaning: "Model-derived anomaly score on a 0–10 scale.",
    calculation: "Synthetic isolation model output normalized to a 0–10 range.",
    formula: "score = normalize(modelOutput) * 10",
    interpretation: "Higher values indicate greater isolation from typical patterns.",
    thresholds: { low: 0, medium: 6, high: 8 },
  },
  shannonEntropy: {
    id: "shannonEntropy",
    label: "Shannon Entropy",
    format: "number",
    precision: 2,
    meaning: "Measures diversity of scanner usage over time.",
    calculation: "Entropy over scanner distribution for the person.",
    formula: "-sum(p_i * log2(p_i))",
    interpretation: "Higher entropy means more varied or unpredictable access locations.",
    thresholds: { low: 0, medium: 1.8, high: 2.6 },
  },
  deniedRate: {
    id: "deniedRate",
    label: "Denied Rate",
    format: "percent",
    precision: 1,
    meaning: "Share of badge attempts that were denied.",
    calculation: "Denied attempts divided by total badge events.",
    formula: "deniedCount / totalEvents",
    interpretation: "Higher rates may indicate access issues or suspicious attempts.",
    thresholds: { low: 0, medium: 8, high: 14 },
  },
  afterHoursRate: {
    id: "afterHoursRate",
    label: "After-Hours Rate",
    format: "percent",
    precision: 1,
    meaning: "Share of events occurring outside standard hours.",
    calculation: "After-hours events divided by total events.",
    formula: "afterHoursEvents / totalEvents",
    interpretation: "Sustained high after-hours activity can warrant review.",
    thresholds: { low: 0, medium: 12, high: 20 },
  },
  weekendRate: {
    id: "weekendRate",
    label: "Weekend Rate",
    format: "percent",
    precision: 1,
    meaning: "Share of badge activity that occurs on weekends.",
    calculation: "Weekend events divided by total events.",
    formula: "weekendEvents / totalEvents",
    interpretation: "Contextual by role; unusually high rates can be atypical.",
    thresholds: { low: 0, medium: 10, high: 18 },
  },
  uniqueDeviceRatio: {
    id: "uniqueDeviceRatio",
    label: "Unique Device Ratio",
    format: "ratio",
    precision: 2,
    meaning: "Measures how many distinct devices are used per event.",
    calculation: "Unique device IDs divided by total events.",
    formula: "uniqueDeviceIds / totalEvents",
    interpretation: "High ratios may indicate device hopping or badge sharing.",
    thresholds: { low: 0, medium: 0.4, high: 0.7 },
  },
};
