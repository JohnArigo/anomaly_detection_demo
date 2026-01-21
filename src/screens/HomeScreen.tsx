import { useMemo, useRef, useState } from "react";
import {
  formatAnomalyScore,
  formatAnomalyScoreFull,
  formatNumber,
  formatPercent,
  formatScore,
} from "../utils/format";
import { formatDate, formatTime } from "../utils/date";
import { Panel } from "../components/ui/Panel";
import { FilterChip } from "../components/ui/FilterChip";
import type { View } from "../types/navigation";
import { badgeEvents, peopleBase } from "../data/mock";
import type { DenialReason, MonthlyPersonSummary } from "../data/types";
import { buildMonthlySummaries, denialReasonOptions, listMonthKeys } from "../data/monthly";
import { RosterTable, type SortDirection, type SortKey } from "../components/roster/RosterTable";
import { FilterDrawer } from "../components/filters/FilterDrawer";
import { PersonCombobox } from "../components/PersonCombobox";

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

const sortRows = (rows: MonthlyPersonSummary[], key: SortKey, dir: SortDirection) => {
  const next = [...rows];
  const getNumericValue = (row: MonthlyPersonSummary, key: SortKey) => {
    switch (key) {
      case "anomalyScore":
        return row.anomalyScore;
      case "shannonEntropy":
        return row.shannonEntropy;
      case "deniedRate":
        return row.deniedRate;
      case "afterHoursRate":
        return row.afterHoursRate;
      case "weekendRate":
        return row.weekendRate;
      case "uniqueDeviceCount":
        return row.uniqueDeviceCount;
      case "rapidBadgingCount":
        return row.rapidBadgingCount;
      default:
        return row.badgedDays.length;
    }
  };

  next.sort((a, b) => {
    const order = dir === "asc" ? 1 : -1;
    if (key === "name") return order * a.name.localeCompare(b.name);
    if (key === "lastEventTimestamp") {
      const at = new Date(a.lastEventTimestamp).getTime();
      const bt = new Date(b.lastEventTimestamp).getTime();
      return order * (at - bt);
    }
    return order * (getNumericValue(a, key) - getNumericValue(b, key));
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("anomalyScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const monthOptions = useMemo(() => listMonthKeys(badgeEvents), []);

  const monthlyRows = useMemo(
    () => buildMonthlySummaries(peopleBase, badgeEvents, activeMonthKey),
    [activeMonthKey],
  );
  const rosterOptions = useMemo(
    () =>
      monthlyRows.map((person) => ({
        value: person.personId,
        label: person.name,
      })),
    [monthlyRows],
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
  const pageSize = 100;
  const pageRows = useMemo(() => sortedRows.slice(0, pageSize), [sortedRows]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nameQuery.trim()) count += 1;
    if (filters.deviceQuery.trim()) count += 1;
    if (hasRange(filters.anomalyRange)) count += 1;
    if (hasRange(filters.deniedRateRange)) count += 1;
    if (hasRange(filters.afterHoursRateRange)) count += 1;
    if (hasRange(filters.weekendRateRange)) count += 1;
    if (hasRange(filters.shannonEntropyRange)) count += 1;
    if (hasRange(filters.uniqueDeviceCountRange)) count += 1;
    if (hasRange(filters.uniqueDeviceStdDevRange)) count += 1;
    if (hasRange(filters.rapidBadgingCountRange)) count += 1;
    if (hasRange(filters.daysActiveRange)) count += 1;
    if (filters.denialReasons.length > 0) count += 1;
    return count;
  }, [filters]);

  const activatePerson = (personId: string) => {
    onSelectPerson(personId);
    onNavigate("profile");
    setHighlightedId(personId);
    window.setTimeout(() => setHighlightedId(null), 700);
  };

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, personId: string) => {
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
        <div className="home-main">
          <div className="home-toolbar">
            <button
              ref={filterButtonRef}
              type="button"
              className={`btn btn--ghost filters-button ${
                activeFilterCount > 0 ? "filters-button--active" : ""
              }`.trim()}
              onClick={() => setFiltersOpen(true)}
              aria-label="Open filters"
              aria-expanded={filtersOpen}
            >
              <span className="filters-button__icon" aria-hidden="true" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filters-button__count">({activeFilterCount})</span>
              )}
            </button>
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
          </div>

          <Panel title="Personnel" className="panel--ghost">
            <RosterTable
              rows={pageRows}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              highlightedId={highlightedId}
              onActivatePerson={activatePerson}
              onRowKeyDown={onRowKeyDown}
              formatters={{
                formatNumber,
                formatPercent,
                formatScore,
                formatAnomalyScore,
                formatAnomalyScoreFull,
                formatDate,
                formatTime,
              }}
            />
          </Panel>
        </div>
      </div>
      <FilterDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        restoreFocusRef={filterButtonRef}
      >
        <div className="filters-panel">
          <div className="filter-section">
            <div className="filter-title">Month</div>
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

          <div className="filter-section">
            <div className="filter-title">Personnel Search</div>
            <PersonCombobox
              options={rosterOptions}
              selectedValue={null}
              selectedLabel={null}
              onSelect={(personId) => {
                onSelectPerson(personId);
                onNavigate("profile");
                setFiltersOpen(false);
              }}
              isProfile={false}
            />
          </div>

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
                  min={-1}
                  max={1}
                  step="0.01"
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
                  min={-1}
                  max={1}
                  step="0.01"
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
        </div>
      </FilterDrawer>
    </section>
  );
};
