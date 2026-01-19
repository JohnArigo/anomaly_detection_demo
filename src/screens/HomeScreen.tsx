import { useMemo, useState } from "react";
import { formatNumber, formatPercent, formatScore } from "../utils/format";
import { formatDate, formatTime } from "../utils/date";
import { Panel } from "../components/ui/Panel";
import { FilterChip } from "../components/ui/FilterChip";
import { EmptyState } from "../components/ui/EmptyState";
import type { View } from "../types/navigation";
import { badgeEvents, peopleBase } from "../data/mock";
import type { DenialReason, MonthlyPersonSummary } from "../data/types";
import { buildMonthlySummaries, denialReasonOptions, listMonthKeys } from "../data/monthly";

const anomalyTone = (value: number) => {
  if (value >= 75) return "danger";
  if (value >= 60) return "warning";
  return "neutral";
};

type RangeFilter = { min: string; max: string };

type HomeFilters = {
  nameQuery: string;
  deviceQuery: string;
  anomalyRange: RangeFilter;
  deniedRateRange: RangeFilter;
  afterHoursRateRange: RangeFilter;
  weekendRateRange: RangeFilter;
  shannonEntropyRange: RangeFilter;
  uniqueDeviceCountRange: RangeFilter;
  uniqueDeviceStdDevRange: RangeFilter;
  rapidBadgingCountRange: RangeFilter;
  daysActiveRange: RangeFilter;
  denialReasons: DenialReason[];
};

type HomeScreenProps = {
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: View) => void;
  activeMonthKey: string;
  onMonthChange: (monthKey: string) => void;
};

const emptyRange = (): RangeFilter => ({ min: "", max: "" });

const defaultFilters = (): HomeFilters => ({
  nameQuery: "",
  deviceQuery: "",
  anomalyRange: emptyRange(),
  deniedRateRange: emptyRange(),
  afterHoursRateRange: emptyRange(),
  weekendRateRange: emptyRange(),
  shannonEntropyRange: emptyRange(),
  uniqueDeviceCountRange: emptyRange(),
  uniqueDeviceStdDevRange: emptyRange(),
  rapidBadgingCountRange: emptyRange(),
  daysActiveRange: emptyRange(),
  denialReasons: [],
});

const toNumber = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const inRange = (value: number, range: RangeFilter) => {
  const min = toNumber(range.min);
  const max = toNumber(range.max);
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
};

const hasRange = (range: RangeFilter) => range.min !== "" || range.max !== "";

const rangeLabel = (label: string, range: RangeFilter) => {
  const min = range.min !== "" ? range.min : "min";
  const max = range.max !== "" ? range.max : "max";
  return `${label}: ${min}-${max}`;
};

type SortKey =
  | "name"
  | "anomalyScore"
  | "shannonEntropy"
  | "deniedRate"
  | "afterHoursRate"
  | "weekendRate"
  | "uniqueDeviceCount"
  | "rapidBadgingCount"
  | "daysActive"
  | "lastEventTimestamp";

type SortDirection = "asc" | "desc";

const sortRows = (rows: MonthlyPersonSummary[], key: SortKey, dir: SortDirection) => {
  const next = [...rows];
  next.sort((a, b) => {
    const order = dir === "asc" ? 1 : -1;
    if (key === "name") return order * a.name.localeCompare(b.name);
    if (key === "lastEventTimestamp") {
      const at = new Date(a.lastEventTimestamp).getTime();
      const bt = new Date(b.lastEventTimestamp).getTime();
      return order * (at - bt);
    }
    if (key === "daysActive") return order * (a.badgedDays.length - b.badgedDays.length);
    return order * ((a as Record<string, number>)[key] - (b as Record<string, number>)[key]);
  });
  return next;
};

export const HomeScreen = ({
  onSelectPerson,
  onNavigate,
  activeMonthKey,
  onMonthChange,
}: HomeScreenProps) => {
  const [filters, setFilters] = useState<HomeFilters>(() => defaultFilters());
  const [sortKey, setSortKey] = useState<SortKey>("anomalyScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const monthOptions = useMemo(() => listMonthKeys(badgeEvents), []);

  const monthlyRows = useMemo(
    () => buildMonthlySummaries(peopleBase, badgeEvents, activeMonthKey),
    [activeMonthKey],
  );

  const filteredRows = useMemo(() => {
    const nameQuery = filters.nameQuery.trim().toLowerCase();
    const deviceQuery = filters.deviceQuery.trim().toLowerCase();
    return monthlyRows.filter((row) => {
      if (nameQuery && !row.name.toLowerCase().includes(nameQuery)) return false;
      if (deviceQuery) {
        const matchesDevice = row.uniqueDevices.some((device) =>
          device.toLowerCase().includes(deviceQuery),
        );
        if (!matchesDevice) return false;
      }
      if (!inRange(row.anomalyScore, filters.anomalyRange)) return false;
      if (!inRange(row.deniedRate, filters.deniedRateRange)) return false;
      if (!inRange(row.afterHoursRate, filters.afterHoursRateRange)) return false;
      if (!inRange(row.weekendRate, filters.weekendRateRange)) return false;
      if (!inRange(row.shannonEntropy, filters.shannonEntropyRange)) return false;
      if (!inRange(row.uniqueDeviceCount, filters.uniqueDeviceCountRange)) return false;
      if (!inRange(row.uniqueDeviceStdDev, filters.uniqueDeviceStdDevRange)) return false;
      if (!inRange(row.rapidBadgingCount, filters.rapidBadgingCountRange)) return false;
      if (!inRange(row.badgedDays.length, filters.daysActiveRange)) return false;
      if (filters.denialReasons.length > 0) {
        const reasonSet = new Set(row.denialReasons.map((reason) => reason.reason));
        const matches = filters.denialReasons.some((reason) => reasonSet.has(reason));
        if (!matches) return false;
      }
      return true;
    });
  }, [filters, monthlyRows]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortKey, sortDir),
    [filteredRows, sortKey, sortDir],
  );

  const summary = useMemo(() => {
    const totalEvents = filteredRows.reduce((sum, row) => sum + row.totalEvents, 0);
    const avgAnomaly =
      filteredRows.length === 0
        ? 0
        : filteredRows.reduce((sum, row) => sum + row.anomalyScore, 0) / filteredRows.length;
    return {
      totalPersonnel: filteredRows.length,
      totalEvents,
      avgAnomaly,
    };
  }, [filteredRows]);

  const activatePerson = (personId: string) => {
    onSelectPerson(personId);
    onNavigate("profile");
    setHighlightedId(personId);
    window.setTimeout(() => setHighlightedId(null), 700);
  };

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, personId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activatePerson(personId);
    }
  };

  const onSort = (key: SortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setSortDir("desc");
      return key;
    });
  };

  const clearFilters = () => setFilters(defaultFilters());

  const toggleReason = (reason: DenialReason) => {
    setFilters((prev) => {
      const next = prev.denialReasons.includes(reason)
        ? prev.denialReasons.filter((item) => item !== reason)
        : [...prev.denialReasons, reason];
      return { ...prev, denialReasons: next };
    });
  };

  return (
    <section className="home">
      <div className="home-layout">
        <aside className="sidebar">
          <Panel title="Filters" className="filters-panel">
            <div className="filter-section">
              <div className="filter-title">Name</div>
              <label className="input">
                <input
                  type="text"
                  placeholder="Search personnel"
                  value={filters.nameQuery}
                  onChange={(event) => setFilters((prev) => ({ ...prev, nameQuery: event.target.value }))}
                />
              </label>
            </div>

            <div className="filter-section">
              <div className="filter-title">Device Search</div>
              <label className="input">
                <input
                  type="text"
                  placeholder="Search device IDs"
                  value={filters.deviceQuery}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, deviceQuery: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="filter-section">
              <div className="filter-title">Anomaly Score</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Min"
                    value={filters.anomalyRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        anomalyRange: { ...prev.anomalyRange, min: event.target.value },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Max"
                    value={filters.anomalyRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        anomalyRange: { ...prev.anomalyRange, max: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Denied Rate</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Min"
                    value={filters.deniedRateRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        deniedRateRange: { ...prev.deniedRateRange, min: event.target.value },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Max"
                    value={filters.deniedRateRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        deniedRateRange: { ...prev.deniedRateRange, max: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">After-Hours Rate</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Min"
                    value={filters.afterHoursRateRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        afterHoursRateRange: {
                          ...prev.afterHoursRateRange,
                          min: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Max"
                    value={filters.afterHoursRateRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        afterHoursRateRange: {
                          ...prev.afterHoursRateRange,
                          max: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Weekend Rate</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Min"
                    value={filters.weekendRateRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        weekendRateRange: { ...prev.weekendRateRange, min: event.target.value },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Max"
                    value={filters.weekendRateRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        weekendRateRange: { ...prev.weekendRateRange, max: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Shannon Entropy</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Min"
                    value={filters.shannonEntropyRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        shannonEntropyRange: {
                          ...prev.shannonEntropyRange,
                          min: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Max"
                    value={filters.shannonEntropyRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        shannonEntropyRange: {
                          ...prev.shannonEntropyRange,
                          max: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Unique Device Count</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={filters.uniqueDeviceCountRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        uniqueDeviceCountRange: {
                          ...prev.uniqueDeviceCountRange,
                          min: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={filters.uniqueDeviceCountRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        uniqueDeviceCountRange: {
                          ...prev.uniqueDeviceCountRange,
                          max: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Unique Device Std Dev</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Min"
                    value={filters.uniqueDeviceStdDevRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        uniqueDeviceStdDevRange: {
                          ...prev.uniqueDeviceStdDevRange,
                          min: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Max"
                    value={filters.uniqueDeviceStdDevRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        uniqueDeviceStdDevRange: {
                          ...prev.uniqueDeviceStdDevRange,
                          max: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Rapid Badging Count</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={filters.rapidBadgingCountRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        rapidBadgingCountRange: {
                          ...prev.rapidBadgingCountRange,
                          min: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={filters.rapidBadgingCountRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        rapidBadgingCountRange: {
                          ...prev.rapidBadgingCountRange,
                          max: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Days Active</div>
              <div className="range-row">
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={filters.daysActiveRange.min}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        daysActiveRange: { ...prev.daysActiveRange, min: event.target.value },
                      }))
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={filters.daysActiveRange.max}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        daysActiveRange: { ...prev.daysActiveRange, max: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Denial Reasons</div>
              <div className="checkbox-list">
                {denialReasonOptions.map((reason) => (
                  <label key={reason} className="checkbox">
                    <input
                      type="checkbox"
                      checked={filters.denialReasons.includes(reason)}
                      onChange={() => toggleReason(reason)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          </Panel>
        </aside>

        <div className="home-main">
          <div className="home-header">
            <div>
              <div className="home-header__title">Monthly Personnel Roster</div>
              <div className="home-header__subtitle">
                Active month: {activeMonthKey}
              </div>
            </div>
            <div className="home-header__controls">
              <label className="select">
                <select
                  value={activeMonthKey}
                  onChange={(event) => onMonthChange(event.target.value)}
                  aria-label="Select month"
                >
                  {monthOptions.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {monthKey}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="kpi-row">
            <div className="kpi-mini">
              <div className="kpi-mini__label">Total Personnel</div>
              <div className="kpi-mini__value">{formatNumber(summary.totalPersonnel)}</div>
            </div>
            <div className="kpi-mini">
              <div className="kpi-mini__label">Total Events</div>
              <div className="kpi-mini__value">{formatNumber(summary.totalEvents)}</div>
            </div>
            <div className="kpi-mini">
              <div className="kpi-mini__label">Avg Anomaly</div>
              <div className="kpi-mini__value">{formatScore(summary.avgAnomaly, 1)}</div>
            </div>
            <div className="kpi-mini">
              <div className="kpi-mini__label">Month</div>
              <div className="kpi-mini__value">{activeMonthKey}</div>
            </div>
          </div>

          <div className="chip-row">
            {filters.nameQuery && (
              <FilterChip
                label={`Name: ${filters.nameQuery}`}
                onRemove={() => setFilters((prev) => ({ ...prev, nameQuery: "" }))}
              />
            )}
            {filters.deviceQuery && (
              <FilterChip
                label={`Device: ${filters.deviceQuery}`}
                onRemove={() => setFilters((prev) => ({ ...prev, deviceQuery: "" }))}
              />
            )}
            {hasRange(filters.anomalyRange) && (
              <FilterChip
                label={rangeLabel("Anomaly", filters.anomalyRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, anomalyRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.deniedRateRange) && (
              <FilterChip
                label={rangeLabel("Denied", filters.deniedRateRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, deniedRateRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.afterHoursRateRange) && (
              <FilterChip
                label={rangeLabel("After-Hours", filters.afterHoursRateRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, afterHoursRateRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.weekendRateRange) && (
              <FilterChip
                label={rangeLabel("Weekend", filters.weekendRateRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, weekendRateRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.shannonEntropyRange) && (
              <FilterChip
                label={rangeLabel("Entropy", filters.shannonEntropyRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, shannonEntropyRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.uniqueDeviceCountRange) && (
              <FilterChip
                label={rangeLabel("Devices", filters.uniqueDeviceCountRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, uniqueDeviceCountRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.uniqueDeviceStdDevRange) && (
              <FilterChip
                label={rangeLabel("Device StdDev", filters.uniqueDeviceStdDevRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, uniqueDeviceStdDevRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.rapidBadgingCountRange) && (
              <FilterChip
                label={rangeLabel("Rapid", filters.rapidBadgingCountRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, rapidBadgingCountRange: emptyRange() }))
                }
              />
            )}
            {hasRange(filters.daysActiveRange) && (
              <FilterChip
                label={rangeLabel("Days Active", filters.daysActiveRange)}
                onRemove={() =>
                  setFilters((prev) => ({ ...prev, daysActiveRange: emptyRange() }))
                }
              />
            )}
            {filters.denialReasons.map((reason) => (
              <FilterChip
                key={reason}
                label={reason}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    denialReasons: prev.denialReasons.filter((item) => item !== reason),
                  }))
                }
              />
            ))}
            <span className="chip-row__meta">
              Showing {sortedRows.length} of {monthlyRows.length}
            </span>
          </div>

          <Panel title="Personnel">
            <div className="table">
              {sortedRows.length === 0 ? (
                <EmptyState title="No results" description="Try adjusting filters." />
              ) : (
                <table className="person-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className="th-button" onClick={() => onSort("name")}>
                          Name
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("anomalyScore")}
                        >
                          Anomaly
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("shannonEntropy")}
                        >
                          Entropy
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("deniedRate")}
                        >
                          Denied Rate
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("afterHoursRate")}
                        >
                          After-Hours
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("weekendRate")}
                        >
                          Weekend
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("uniqueDeviceCount")}
                        >
                          Devices
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("rapidBadgingCount")}
                        >
                          Rapid
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("daysActive")}
                        >
                          Days Active
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-button"
                          onClick={() => onSort("lastEventTimestamp")}
                        >
                          Last Event
                        </button>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((person) => (
                      <tr
                        key={`${person.monthKey}-${person.personId}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open ${person.name}`}
                        className={highlightedId === person.personId ? "row--active" : undefined}
                        onClick={() => activatePerson(person.personId)}
                        onKeyDown={(event) => onRowKeyDown(event, person.personId)}
                      >
                        <td>
                          <div className="person-cell">
                            <div className="avatar">{person.name.charAt(0)}</div>
                            <div>
                              <div className="person-name">{person.name}</div>
                              <div className="person-sub">{person.monthKey}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`anomaly-chip anomaly-chip--${anomalyTone(
                              person.anomalyScore,
                            )}`}
                          >
                            {person.anomalyScore}
                          </span>
                        </td>
                        <td>{formatScore(person.shannonEntropy, 2)}</td>
                        <td>{formatPercent(person.deniedRate, 1)}</td>
                        <td>{formatPercent(person.afterHoursRate, 1)}</td>
                        <td>{formatPercent(person.weekendRate, 1)}</td>
                        <td>{formatNumber(person.uniqueDeviceCount)}</td>
                        <td>{formatNumber(person.rapidBadgingCount)}</td>
                        <td>{formatNumber(person.badgedDays.length)}</td>
                        <td>
                          <div className="last-badge">
                            <span>{formatDate(person.lastEventTimestamp)}</span>
                            <span className="last-badge__time">
                              {formatTime(person.lastEventTimestamp)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--ghost btn--small"
                            onClick={(event) => {
                              event.stopPropagation();
                              activatePerson(person.personId);
                            }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
};
