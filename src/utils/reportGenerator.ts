import type { BaseRow, ExplanationRow } from "../data/types";

type LlmSummary = {
  meta: {
    cardholder_name: string;
    period: { year: number; month: number; label: string };
    neighbor_baseline: { k: number };
    status: { label: string; reason_short: string };
  };
  executive_summary: string[];
  time_window: {
    first_event_time: string;
    last_event_time: string;
    is_partial_month_likely: boolean;
    note: string;
  };
  key_findings: Array<{
    metric_key: string;
    metric_label: string;
    unit: "count" | "ratio" | "score";
    user_value: number;
    peer_avg_value: number;
    typical_range: { p25: number; p75: number };
    delta_vs_peers: number;
    direction_vs_peers: "higher" | "lower" | "about_the_same";
    assessment: string;
    why_it_matters: string;
    caveat?: string;
  }>;
  typical_signals: Array<{ metric_key: string; metric_label: string; summary: string }>;
  data_notes: Array<{ type: string; message: string; metric_key?: string }>;
  raw_supporting_values: {
    user_metrics_subset: Record<string, number>;
    peer_averages_subset: Record<string, number>;
  };
};

const monthLabel = (year: number, month: number) => {
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[Math.max(0, Math.min(11, month - 1))]} ${year}`;
};

const direction = (delta: number): "higher" | "lower" | "about_the_same" => {
  if (Math.abs(delta) < 1e-6) return "about_the_same";
  return delta > 0 ? "higher" : "lower";
};

const assessmentLabel = (dir: string, unit: string) => {
  if (dir === "about_the_same") return "typical";
  if (unit === "ratio") return dir === "higher" ? "higher_than_typical" : "lower_than_typical";
  return dir === "higher" ? "higher_than_typical" : "lower_than_typical";
};

const makeFinding = (
  base: BaseRow,
  explanation: ExplanationRow,
  key: string,
  label: string,
  unit: "count" | "ratio" | "score",
  why: string,
  caveat?: string,
) => {
  const userValue = Number(base[key] ?? 0);
  const peerAvg = Number((explanation as Record<string, number>)[`nn_avg_${key}`] ?? userValue * 0.6);
  const p25 = Number((explanation as Record<string, number>)[`p25_${key}`] ?? peerAvg * 0.6);
  const p75 = Number((explanation as Record<string, number>)[`p75_${key}`] ?? peerAvg * 1.4);
  const delta = userValue - peerAvg;
  const dir = direction(delta);
  return {
    metric_key: key,
    metric_label: label,
    unit,
    user_value: userValue,
    peer_avg_value: peerAvg,
    typical_range: { p25, p75 },
    delta_vs_peers: delta,
    direction_vs_peers: dir,
    assessment: assessmentLabel(dir, unit),
    why_it_matters: why,
    caveat,
  };
};

export const buildLlmSummary = (base: BaseRow, explanation: ExplanationRow) => {
  const keyFindings = [];
  keyFindings.push(
    makeFinding(
      base,
      explanation,
      "count_events",
      "Total badge events",
      "count",
      "Higher volume can indicate heavier usage or increased activity compared to similar people.",
    ),
  );
  keyFindings.push(
    makeFinding(
      base,
      explanation,
      "iforest_score",
      "Overall scoring indicator",
      "score",
      "A general indicator of how typical the overall pattern is for this month.",
    ),
  );

  keyFindings.push(
    makeFinding(
      base,
      explanation,
      "off_hours_ratio",
      "Off-hours activity rate",
      "ratio",
      "Off-hours activity can be a scheduling risk signal.",
      base.off_hours_ratio === 0
        ? "No off-hours activity was observed during this window."
        : undefined,
    ),
  );
  keyFindings.push(
    makeFinding(
      base,
      explanation,
      "weekend_ratio",
      "Weekend activity rate",
      "ratio",
      "Weekend activity can be a scheduling risk signal.",
      base.weekend_ratio === 0 ? "No weekend activity was observed during this window." : undefined,
    ),
  );

  if (base.rapid_scan_sequence_count > 0 || base.is_anomaly === 1) {
    keyFindings.push(
      makeFinding(
        base,
        explanation,
        "rapid_scan_sequence_count",
        "Rapid scan sequences",
        "count",
        "Rapid repeated scans can indicate unusual behavior.",
        base.rapid_scan_sequence_count === 0 ? "No rapid scan sequences were observed." : undefined,
      ),
    );
  }

  if ("denial_rate" in base) {
    keyFindings.push(
      makeFinding(
        base,
        explanation,
        "denial_rate",
        "Denial rate",
        "ratio",
        "Denied attempts can indicate access issues or policy mismatches.",
      ),
    );
  }

  const statusLabel =
    base.is_anomaly === 1
      ? "Flagged"
      : base.count_events > Number((explanation as Record<string, number>).p75_count_events ?? 0)
      ? "Slightly Unusual"
      : "Typical";

  const executive = [
    `Compared to similar people, this user shows a ${base.count_events > 120 ? "higher" : "typical"} total volume of badge activity.`,
    base.off_hours_ratio > 0
      ? "Off-hours activity is present during this month."
      : "No off-hours activity was observed in the provided window.",
    base.weekend_ratio > 0
      ? "Weekend activity was observed this month."
      : "No weekend activity was observed in the provided window.",
    base.rapid_scan_sequence_count > 0
      ? "Rapid scan sequences were detected."
      : "No rapid-scan behavior was detected.",
  ];

  const first = new Date(base.first_event_time);
  const last = new Date(base.last_event_time);
  const spanDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000));
  const partial = spanDays < 26;

  const summary: LlmSummary = {
    meta: {
      cardholder_name: base.cardholder_name,
      period: {
        year: base.year,
        month: base.month,
        label: monthLabel(base.year, base.month),
      },
      neighbor_baseline: { k: explanation.nn_k_found || 10 },
      status: {
        label: statusLabel,
        reason_short:
          statusLabel === "Flagged"
            ? "Pattern was flagged by the model this month."
            : statusLabel === "Slightly Unusual"
            ? "Activity volume is above typical peers; timing remains mostly typical."
            : "Activity profile aligns with similar people.",
      },
    },
    executive_summary: executive,
    time_window: {
      first_event_time: base.first_event_time,
      last_event_time: base.last_event_time,
      is_partial_month_likely: partial,
      note: partial
        ? `Activity spans ${monthLabel(base.year, base.month)} partially; this may not represent a full month.`
        : "Activity spans the full month window.",
    },
    key_findings: keyFindings.slice(0, 6),
    typical_signals: [
      {
        metric_key: "iforest_score",
        metric_label: "Overall scoring indicator",
        summary: "Overall score remains within typical range for similar users.",
      },
      {
        metric_key: "rapid_scan_sequence_count",
        metric_label: "Rapid scan sequences",
        summary:
          base.rapid_scan_sequence_count === 0
            ? "No rapid scan sequences observed."
            : "Rapid scan sequences detected; review for anomalies.",
      },
    ],
    data_notes: partial
      ? [
          {
            type: "partial_month_likely",
            message:
              "Activity does not span the full month; comparisons may reflect a partial window.",
          },
        ]
      : [],
    raw_supporting_values: {
      user_metrics_subset: {
        count_events: base.count_events,
        unique_devices: base.unique_devices,
        working_hours_count: base.working_hours_count,
        off_hours_count: base.off_hours_count,
        weekend_count: base.weekend_count,
        off_hours_ratio: base.off_hours_ratio,
        weekend_ratio: base.weekend_ratio,
        rapid_scan_sequence_count: base.rapid_scan_sequence_count,
        iforest_score: base.iforest_score,
        is_anomaly: base.is_anomaly,
      },
      peer_averages_subset: {
        nn_avg_count_events: Number((explanation as Record<string, number>).nn_avg_count_events ?? 0),
        nn_avg_off_hours_ratio: Number(
          (explanation as Record<string, number>).nn_avg_off_hours_ratio ?? 0,
        ),
        nn_avg_weekend_ratio: Number(
          (explanation as Record<string, number>).nn_avg_weekend_ratio ?? 0,
        ),
        nn_avg_time_of_day_stddev: Number(
          (explanation as Record<string, number>).nn_avg_time_of_day_stddev ?? 0,
        ),
        nn_avg_iforest_score: Number(
          (explanation as Record<string, number>).nn_avg_iforest_score ?? 0,
        ),
        nn_avg_rapid_scan_sequence_count: Number(
          (explanation as Record<string, number>).nn_avg_rapid_scan_sequence_count ?? 0,
        ),
      },
    },
  };

  return JSON.stringify(summary);
};
