export type PersonId = string;

export type BaseEvent = {
  timestamp: string;
  event_type: string;
  outcome: string;
  device: string;
  location: string;
};

export type DeviceScan = {
  device: string;
  scan_count: number;
};

export type BaseRow = {
  cardholder_name: string;
  year: number;
  month: number;
  first_event_time: string;
  last_event_time: string;
  count_events: number;
  unique_devices: number;
  time_of_day_stddev: number;
  working_hours_count: number;
  off_hours_count: number;
  off_hours_ratio: number;
  weekend_count: number;
  weekend_ratio: number;
  rapid_scan_sequence_count: number;
  denial_rate: number;
  iforest_score: number;
  is_anomaly: number;
  all_events: string;
  unique_device_scans: string;
  [key: string]: string | number;
};

export type ExplanationRow = {
  cardholder_name: string;
  year: number;
  month: number;
  nn_k_found: number;
  nn_avg_distance: number;
  nn_min_distance: number;
  llm_payload_json: string;
  llm_summary_json: string;
  [key: string]: string | number | null;
};

export type JoinedRow = BaseRow & ExplanationRow;
