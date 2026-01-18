import { useMemo, useState } from "react";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatPercent, formatScore } from "../utils/format";
import { Panel } from "../components/ui/Panel";
import { FilterChip } from "../components/ui/FilterChip";
import { BadgePill } from "../components/ui/BadgePill";
import type { View } from "../types/navigation";
import { badgeEvents, baseNow, peopleBase, scanners } from "../data/mock";
import { buildPersonRollup, buildProfiles } from "../data/rollups";
import { createDefaultFilters } from "../utils/range";
import type { FilterState } from "../utils/filters";
import { normalizeAnomalyRange } from "../utils/filters";
import { sortRollups, type RollupSortKey, type SortDirection } from "../utils/sort";

const entropyLabel = (value: number) => {
  if (value >= 2.6) return "High";
  if (value >= 1.9) return "Medium";
  return "Low";
};

const anomalyTone = (value: number) => {
  if (value >= 75) return "danger";
  if (value >= 60) return "warning";
  return "neutral";
};

type HomeScreenProps = {
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: View) => void;
};

const normalizeFilters = (filters: FilterState): FilterState => {
  const normalizedRange = normalizeAnomalyRange(filters.anomalyRange);
  const start = filters.dateRange.start;
  const end = filters.dateRange.end;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const orderedRange =
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    startDate.getTime() > endDate.getTime()
      ? { start: end, end: start }
      : { start, end };

  return {
    ...filters,
    dateRange: {
      ...filters.dateRange,
      ...orderedRange,
    },
    anomalyRange: normalizedRange,
  };
};

export const HomeScreen = ({ onSelectPerson, onNavigate }: HomeScreenProps) => {
  const initialFilters = useMemo(() => createDefaultFilters(baseNow), []);
  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [sortKey, setSortKey] = useState<RollupSortKey>("anomalyScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { profiles, summary } = useMemo(
    () => buildProfiles(peopleBase, badgeEvents, appliedFilters),
    [appliedFilters],
  );

  const rollups = useMemo(() => profiles.map(buildPersonRollup), [profiles]);
  const sortedRollups = useMemo(
    () => sortRollups(rollups, sortKey, sortDir),
    [rollups, sortKey, sortDir],
  );

  const highlightedPeople = useMemo(() => sortedRollups.slice(0, 2), [sortedRollups]);

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

  const updateDraft = (patch: Partial<FilterState>) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  };

  const toInput = (value: Date) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const buildRange = (days: number, label: string) => {
    const end = new Date(baseNow);
    const start = new Date(baseNow);
    start.setDate(start.getDate() - days);
    return { label, start: toInput(start), end: toInput(end) };
  };

  const toggleLocation = (locationId: string) => {
    setDraftFilters((prev) => {
      const next = prev.locations.includes(locationId)
        ? prev.locations.filter((id) => id !== locationId)
        : [...prev.locations, locationId];
      return { ...prev, locations: next };
    });
  };

  const applyFilters = () => {
    setAppliedFilters(normalizeFilters(draftFilters));
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const onSort = (key: RollupSortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setSortDir("desc");
      return key;
    });
  };

  const selectedLocationLabels = appliedFilters.locations
    .map((id) => scanners.find((scanner) => scanner.id === id)?.name)
    .filter((label): label is string => Boolean(label));

  return (
    <section className="home">
      <div className="home-layout">
        <aside className="sidebar">
          <Panel title="Filters">
            <div className="filter-row">
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                Clear All
              </button>
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`btn btn--chip ${
                    draftFilters.dateRange.label === "Last 7d" ? "btn--active" : ""
                  }`.trim()}
                  onClick={() => updateDraft({ dateRange: buildRange(7, "Last 7d") })}
                >
                  Last 7d
                </button>
                <button
                  type="button"
                  className={`btn btn--chip ${
                    draftFilters.dateRange.label === "Last 30d" ? "btn--active" : ""
                  }`.trim()}
                  onClick={() => updateDraft({ dateRange: buildRange(30, "Last 30d") })}
                >
                  Last 30d
                </button>
                <button
                  type="button"
                  className={`btn btn--chip ${
                    draftFilters.dateRange.label === "Last 90d" ? "btn--active" : ""
                  }`.trim()}
                  onClick={() => updateDraft({ dateRange: buildRange(90, "Last 90d") })}
                >
                  Last 90d
                </button>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Date Range</div>
              <div className="date-row">
                <label className="input">
                  <span className="sr-only">Start date</span>
                  <input
                    type="date"
                    value={draftFilters.dateRange.start}
                    onChange={(event) =>
                      updateDraft({
                        dateRange: {
                          ...draftFilters.dateRange,
                          start: event.target.value,
                          label: "Custom",
                        },
                      })
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <span className="sr-only">End date</span>
                  <input
                    type="date"
                    value={draftFilters.dateRange.end}
                    onChange={(event) =>
                      updateDraft({
                        dateRange: {
                          ...draftFilters.dateRange,
                          end: event.target.value,
                          label: "Custom",
                        },
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Outcome</div>
              <div className="checkbox-list">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draftFilters.includeApproved}
                    onChange={(event) => updateDraft({ includeApproved: event.target.checked })}
                  />
                  <span>Include Approved</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draftFilters.includeDenied}
                    onChange={(event) => updateDraft({ includeDenied: event.target.checked })}
                  />
                  <span>Include Denied</span>
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Flags</div>
              <div className="checkbox-list">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draftFilters.afterHoursOnly}
                    onChange={(event) => updateDraft({ afterHoursOnly: event.target.checked })}
                  />
                  <span>After-Hours only</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={draftFilters.flaggedOnly}
                    onChange={(event) => updateDraft({ flaggedOnly: event.target.checked })}
                  />
                  <span>Flagged only</span>
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Locations</div>
              <div className="checkbox-list">
                {scanners.map((scanner) => (
                  <label key={scanner.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={draftFilters.locations.includes(scanner.id)}
                      onChange={() => toggleLocation(scanner.id)}
                    />
                    <span>{scanner.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Device ID</div>
              <label className="input">
                <input
                  type="text"
                  placeholder="Search device"
                  value={draftFilters.deviceIdQuery}
                  onChange={(event) => updateDraft({ deviceIdQuery: event.target.value })}
                />
              </label>
            </div>

            <div className="filter-section">
              <div className="filter-title">Personnel</div>
              <label className="input">
                <input
                  type="text"
                  placeholder="Search name"
                  value={draftFilters.personQuery}
                  onChange={(event) => updateDraft({ personQuery: event.target.value })}
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
                    value={draftFilters.anomalyRange.min}
                    onChange={(event) =>
                      updateDraft({
                        anomalyRange: {
                          ...draftFilters.anomalyRange,
                          min: Number(event.target.value),
                        },
                      })
                    }
                  />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draftFilters.anomalyRange.max}
                    onChange={(event) =>
                      updateDraft({
                        anomalyRange: {
                          ...draftFilters.anomalyRange,
                          max: Number(event.target.value),
                        },
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={draftFilters.includeZeroEvents}
                  onChange={(event) => updateDraft({ includeZeroEvents: event.target.checked })}
                />
                <span>Include people with 0 events</span>
              </label>
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                Clear All
              </button>
              <button type="button" className="btn btn--primary" onClick={applyFilters}>
                Apply
              </button>
            </div>
          </Panel>
        </aside>

        <div className="home-main">
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
              <div className="kpi-mini__label">After-Hours</div>
              <div className="kpi-mini__value">
                {formatNumber(summary.afterHoursEvents)} / {formatNumber(summary.afterHoursDays)}
              </div>
            </div>
          </div>

          <div className="chip-row">
            <FilterChip label={appliedFilters.dateRange.label} tone="active" />
            {selectedLocationLabels.map((label) => (
              <FilterChip key={label} label={label} />
            ))}
            {appliedFilters.deviceIdQuery && (
              <FilterChip label={`Device: ${appliedFilters.deviceIdQuery}`} />
            )}
            {appliedFilters.personQuery && (
              <FilterChip label={`Name: ${appliedFilters.personQuery}`} />
            )}
            {!appliedFilters.includeApproved && appliedFilters.includeDenied && (
              <FilterChip label="Denied Only" tone="active" />
            )}
            {appliedFilters.afterHoursOnly && <FilterChip label="After-Hours" tone="active" />}
            {appliedFilters.flaggedOnly && <FilterChip label="Flagged" tone="active" />}
            <span className="chip-row__meta">
              Showing {sortedRollups.length} of {peopleBase.length}
            </span>
          </div>

          <Panel title="Personnel">
            <div className="table-actions">
              <button type="button" className="btn btn--ghost btn--small" onClick={() => onSort("name")}>
                Sort Name
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onSort("anomalyScore")}
              >
                Sort Anomaly
              </button>
            </div>
            <div className="table">
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
                        onClick={() => onSort("isolationForestScore")}
                      >
                        Isolation Forest
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="th-button"
                        onClick={() => onSort("shannonEntropy")}
                      >
                        Shannon Entropy
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="th-button"
                        onClick={() => onSort("denialPercent")}
                      >
                        Denied Rate
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="th-button"
                        onClick={() => onSort("lastBadgeTimestamp")}
                      >
                        Last Badge
                      </button>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRollups.map((person) => (
                    <tr
                      key={person.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open ${person.name}`}
                      className={highlightedId === person.id ? "row--active" : undefined}
                      onClick={() => activatePerson(person.id)}
                      onKeyDown={(event) => onRowKeyDown(event, person.id)}
                    >
                      <td>
                        <div className="person-cell">
                          <div className="avatar">{person.name.charAt(0)}</div>
                          <div>
                            <div className="person-name">{person.name}</div>
                            <div className="person-sub">{person.activeWindowLabel}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`anomaly-chip anomaly-chip--${anomalyTone(person.anomalyScore)}`}>
                          {person.anomalyScore}
                        </span>
                      </td>
                      <td>{formatScore(person.isolationForestScore, 1)}</td>
                      <td>
                        <div className="entropy-cell">
                          <span>{entropyLabel(person.shannonEntropy)}</span>
                          <span className="entropy-sub">{formatScore(person.shannonEntropy, 2)}</span>
                        </div>
                      </td>
                      <td>{formatPercent(person.denialPercent, 1)}</td>
                      <td>
                        <div className="last-badge">
                          <span>{formatDate(person.lastBadgeTimestamp)}</span>
                          <span className="last-badge__time">
                            {formatTime(person.lastBadgeTimestamp)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={(event) => {
                            event.stopPropagation();
                            activatePerson(person.id);
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Highlighted Personnel">
            <div className="highlight-list">
              {highlightedPeople.map((person) => (
                <div key={`highlight-${person.id}`} className="highlight-row">
                  <div className="person-cell">
                    <div className="avatar">{person.name.charAt(0)}</div>
                    <div>
                      <div className="person-name">{person.name}</div>
                      <div className="person-sub">{person.activeWindowLabel}</div>
                    </div>
                  </div>
                  <div className="highlight-metrics">
                    <span className={`anomaly-chip anomaly-chip--${anomalyTone(person.anomalyScore)}`}>
                      {person.anomalyScore}
                    </span>
                    <span>{formatScore(person.isolationForestScore, 1)}</span>
                    <BadgePill
                      label={entropyLabel(person.shannonEntropy)}
                      variant={person.shannonEntropy > 2.4 ? "flag" : "neutral"}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => activatePerson(person.id)}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
};
