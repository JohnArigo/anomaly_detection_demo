const excludedCountKeys = new Set([
  "count_events",
  "unique_devices",
  "working_hours_count",
  "off_hours_count",
  "weekend_count",
  "rapid_scan_sequence_count",
]);

export const getDynamicCountKeys = (row: Record<string, string | number | null>) => {
  return Object.keys(row).filter((key) => {
    if (!key.endsWith("_count")) return false;
    if (excludedCountKeys.has(key)) return false;
    return typeof row[key] === "number";
  });
};

export const getEventTypeCounts = (row: Record<string, string | number | null>) => {
  const keys = getDynamicCountKeys(row);
  return keys
    .map((key) => ({
      key,
      label: key.replace(/_count$/i, "").replace(/_/g, " "),
      count: Number(row[key] ?? 0),
    }))
    .sort((a, b) => b.count - a.count);
};
