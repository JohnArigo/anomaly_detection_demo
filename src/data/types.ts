export type Outcome = "approved" | "denied";

export type DenialReason =
  | "Expired Badge"
  | "Time Restricted"
  | "Invalid Entry Code"
  | "No Access"
  | "Unknown";

export type FlagType =
  | "After-Hours"
  | "New Location"
  | "Rapid Repeat"
  | "Training Overdue";

export type LocationStat = {
  locationId: string;
  displayName: string;
  count: number;
};

export type DenialReasonStat = {
  reason: DenialReason;
  count: number;
};

export type FlagStat = {
  flag: FlagType;
  count: number;
};

export type BadgeEvent = {
  id: string;
  personId: string;
  timestamp: string;
  scannerId: string;
  scannerName: string;
  outcome: Outcome;
  denialReason?: DenialReason;
  flags: FlagType[];
  deviceId: string;
};

export type PersonId = string;

export type PersonBase = {
  id: PersonId;
  name: string;
  isAnomaly: number;
};

export type PersonProfile = {
  id: string;
  name: string;
  anomalyScore: number;
  isAnomaly: number;
  isolationForestScore: number;
  shannonEntropy: number;
  approvedCount: number;
  deniedCount: number;
  scannerLocations: LocationStat[];
  denialPercent: number;
  uniqueDeviceRatio: number;
  afterHoursRate: number;
  weekendRate: number;
  lastBadgeTimestamp: string;
  activeWindowLabel: string;
  totalEvents: number;
  denialReasons: DenialReasonStat[];
  recentEvents: BadgeEvent[];
  topFlags: FlagStat[];
  statusLabel: string;
  statusReasons: string[];
};

export type PersonRollup = {
  id: string;
  name: string;
  anomalyScore: number;
  isAnomaly: number;
  isolationForestScore: number;
  shannonEntropy: number;
  denialPercent: number;
  lastBadgeTimestamp: string;
  activeWindowLabel: string;
  totalEvents: number;
};

export type MonthlyPersonSummary = {
  personId: string;
  name: string;
  monthKey: string;
  lastEventTimestamp: string;
  anomalyScore: number;
  isAnomaly: number;
  shannonEntropy: number;
  deniedRate: number;
  weekendRate: number;
  afterHoursRate: number;
  uniqueDeviceStdDev: number;
  uniqueDeviceCount: number;
  uniqueDevices: string[];
  denialReasons: DenialReasonStat[];
  totalEvents: number;
  acceptedCount: number;
  deniedCount: number;
  rapidBadgingCount: number;
  badgedDays: number[];
};

export type DenialBreakdownModel = {
  totalDenied: number;
  denialReasons: DenialReasonStat[];
  topFlags: FlagStat[];
  recentDeniedEvents: BadgeEvent[];
};

export type PersonnelSummary = {
  totalPersonnel: number;
  totalEvents: number;
  avgAnomaly: number;
  afterHoursEvents: number;
  afterHoursDays: number;
  activeWindowLabel: string;
};
