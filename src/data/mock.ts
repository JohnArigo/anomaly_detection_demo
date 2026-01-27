import { mulberry32, seedFromString } from "./seed";
import type { BaseEvent, BaseRow, DeviceScan, ExplanationRow } from "./types";
import { buildLlmSummary } from "../utils/reportGenerator";

const PERSON_COUNT = 120;
const MONTH_COUNT = 6;
const ANOMALY_RATE = 0.12;

const firstNames = [
  "Avery",
  "Malik",
  "Priya",
  "Sofia",
  "Omar",
  "Hannah",
  "Emilio",
  "Noah",
  "Ivy",
  "Declan",
  "Lena",
  "Kai",
  "Morgan",
  "Ravi",
  "Zoe",
  "Elias",
  "Nia",
  "Aria",
  "Felix",
  "Quinn",
  "Jules",
  "Amina",
  "Levi",
  "Mae",
  "Caleb",
  "Nora",
  "Tariq",
  "June",
  "Mira",
  "Hugo",
];

const lastNames = [
  "Chen",
  "Johnson",
  "Nayar",
  "Alvarez",
  "Rahman",
  "Park",
  "Torres",
  "Bennett",
  "Thompson",
  "Wu",
  "Patel",
  "Klein",
  "Sato",
  "Cruz",
  "Brooks",
  "Hassan",
  "Nguyen",
  "Ibrahim",
  "Kim",
  "Murphy",
  "Holt",
  "Mejia",
  "Owens",
  "Singh",
  "Diaz",
  "Olsen",
  "Baker",
  "Hsu",
  "Roman",
  "Kaur",
];

const eventTypes = ["Granted", "Denied", "Invalid_Badge", "Tailgate"];

export const baseNow = new Date("2026-01-28T12:00:00Z");

const buildName = (index: number) => {
  const first = firstNames[index % firstNames.length];
  const lastIndex = Math.floor(index / firstNames.length) % lastNames.length;
  const last = lastNames[lastIndex];
  const baseName = `${first} ${last}`;
  const suffixIndex = Math.floor(index / (firstNames.length * lastNames.length));
  return suffixIndex > 0 ? `${baseName} ${suffixIndex + 1}` : baseName;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const randomInt = (rng: () => number, min: number, max: number) => {
  return Math.floor(rng() * (max - min + 1)) + min;
};

const monthKeys = Array.from({ length: MONTH_COUNT }, (_, index) => {
  const date = new Date(baseNow);
  date.setUTCMonth(baseNow.getUTCMonth() - index);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
});

const buildEventSample = (
  rng: () => number,
  eventCount: number,
  firstIso: string,
  lastIso: string,
): BaseEvent[] => {
  const first = new Date(firstIso).getTime();
  const last = new Date(lastIso).getTime();
  const locations = ["HQ North Lobby", "HQ South Lobby", "Ops Warehouse", "R&D East Bay"];
  const devices = Array.from({ length: 6 }, (_, idx) => `DEV-${idx + 1}`);
  const count = Math.min(eventCount, 30);
  return Array.from({ length: count }, () => {
    const eventType = eventTypes[Math.floor(rng() * eventTypes.length)];
    const outcome = eventType === "Granted" ? "Granted" : "Denied";
    const timestamp = new Date(first + rng() * Math.max(1, last - first)).toISOString();
    return {
      timestamp,
      event_type: eventType,
      outcome,
      device: devices[Math.floor(rng() * devices.length)],
      location: locations[Math.floor(rng() * locations.length)],
    };
  });
};

const buildDeviceScans = (rng: () => number, uniqueDevices: number): DeviceScan[] => {
  const count = clamp(uniqueDevices, 3, 12);
  return Array.from({ length: count }, (_, idx) => ({
    device: `DEV-${idx + 1}`,
    scan_count: randomInt(rng, 1, 12),
  }));
};

const buildBaseRow = (
  rng: () => number,
  cardholder: string,
  year: number,
  month: number,
): BaseRow => {
  const count_events = randomInt(rng, 60, 320);
  const unique_devices = clamp(randomInt(rng, 3, 20), 1, count_events);
  const off_hours_count = randomInt(rng, 4, Math.max(6, Math.floor(count_events * 0.45)));
  const working_hours_count = Math.max(0, count_events - off_hours_count);
  const weekend_count = randomInt(rng, 2, Math.max(5, Math.floor(count_events * 0.35)));
  const rapid_scan_sequence_count = randomInt(rng, 0, 12);
  const time_of_day_stddev = clamp(2 + rng() * 3.5, 0.5, 7.5);

  const denied = randomInt(rng, 1, Math.max(3, Math.floor(count_events * 0.18)));
  const granted = Math.max(0, count_events - denied);
  const invalidBadge = randomInt(rng, 0, Math.min(denied, 8));
  const tailgate = randomInt(rng, 0, 6);

  const first_event_time = new Date(Date.UTC(year, month - 1, 1, 8, 12)).toISOString();
  const last_event_time = new Date(Date.UTC(year, month - 1, 27, 18, 42)).toISOString();

  const baseScore = clamp(0.45 + rng() * 0.4, 0.05, 0.95);

  const all_events = JSON.stringify(
    buildEventSample(rng, count_events, first_event_time, last_event_time),
  );
  const unique_device_scans = JSON.stringify(buildDeviceScans(rng, unique_devices));

  return {
    cardholder_name: cardholder,
    year,
    month,
    first_event_time,
    last_event_time,
    count_events,
    unique_devices,
    time_of_day_stddev,
    working_hours_count,
    off_hours_count,
    off_hours_ratio: count_events === 0 ? 0 : off_hours_count / count_events,
    weekend_count,
    weekend_ratio: count_events === 0 ? 0 : weekend_count / count_events,
    rapid_scan_sequence_count,
    denial_rate: count_events === 0 ? 0 : denied / count_events,
    iforest_score: baseScore,
    is_anomaly: 0,
    all_events,
    unique_device_scans,
    Granted_count: granted,
    Denied_count: denied,
    Invalid_Badge_count: invalidBadge,
    Tailgate_count: tailgate,
  };
};

const metricKeys = [
  "count_events",
  "unique_devices",
  "time_of_day_stddev",
  "working_hours_count",
  "off_hours_count",
  "off_hours_ratio",
  "weekend_count",
  "weekend_ratio",
  "rapid_scan_sequence_count",
  "denial_rate",
  "iforest_score",
];

const buildExplanationRow = (rng: () => number, base: BaseRow): ExplanationRow => {
  const weights = metricKeys.map(() => rng());
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1;
  const normalized = weights.map((value) => value / weightSum);

  const row: ExplanationRow = {
    cardholder_name: base.cardholder_name,
    year: base.year,
    month: base.month,
    nn_k_found: randomInt(rng, 6, 18),
    nn_avg_distance: clamp(0.6 + rng() * 1.4, 0.2, 3.2),
    nn_min_distance: clamp(0.2 + rng() * 0.8, 0.05, 1.2),
    llm_payload_json: JSON.stringify({
      subject: base.cardholder_name,
      month: `${base.year}-${String(base.month).padStart(2, "0")}`,
      note: "Mock payload for explanation.",
    }),
    llm_summary_json: "",
  };

  metricKeys.forEach((key, idx) => {
    const value = Number(base[key] ?? 0);
    const spread = value === 0 ? 1 : Math.abs(value) * (0.15 + rng() * 0.25);
    const med = value + (rng() - 0.5) * spread;
    const p25 = med - spread * (0.45 + rng() * 0.2);
    const p75 = med + spread * (0.45 + rng() * 0.2);
    const iqr = Math.max(0.0001, Math.abs(p75 - p25));
    const rz = (value - med) / (iqr / 1.349);
    const nn_avg = med + (rng() - 0.5) * spread * 0.6;
    const delta = value - nn_avg;
    row[`med_${key}`] = med;
    row[`p25_${key}`] = p25;
    row[`p75_${key}`] = p75;
    row[`iqr_${key}`] = iqr;
    row[`rz_${key}`] = rz;
    row[`wt_${key}`] = normalized[idx];
    row[`nn_avg_${key}`] = nn_avg;
    row[`delta_vs_nn_${key}`] = delta;
  });

  return row;
};

const people = Array.from({ length: PERSON_COUNT }, (_, index) => buildName(index));

const baseRows: BaseRow[] = [];
const explanationRows: ExplanationRow[] = [];

monthKeys.forEach((month) => {
  const monthRows: BaseRow[] = [];
  people.forEach((name) => {
    const rng = mulberry32(seedFromString(`${name}-${month.year}-${month.month}`));
    const base = buildBaseRow(rng, name, month.year, month.month);
    monthRows.push(base);
    const explanation = buildExplanationRow(rng, base);
    explanation.llm_summary_json = buildLlmSummary(base, explanation);
    explanationRows.push(explanation);
  });

  const anomalyCount = Math.max(1, Math.floor(monthRows.length * ANOMALY_RATE));
  const anomalyIds = new Set(
    [...monthRows]
      .sort((a, b) => a.iforest_score - b.iforest_score)
      .slice(0, anomalyCount)
      .map((row) => row.cardholder_name),
  );

  monthRows.forEach((row) => {
    row.is_anomaly = anomalyIds.has(row.cardholder_name) ? 1 : 0;
  });

  baseRows.push(...monthRows);
});

export const baseTable = baseRows;
export const explanationTable = explanationRows;
