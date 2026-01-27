export type AnomalyStatus = "flagged" | "normal";

export const getAnomalyStatus = (isAnomaly: number): AnomalyStatus => {
  return isAnomaly === 1 ? "flagged" : "normal";
};

export const anomalyLabel = (status: AnomalyStatus) => {
  return status === "flagged" ? "FLAGGED" : "NORMAL";
};

export const anomalyTone = (status: AnomalyStatus) => {
  return status === "flagged" ? "danger" : "neutral";
};
