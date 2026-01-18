import { useMemo, useState } from "react";
import type { PersonRollup, PersonnelSummary } from "../data/types";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatPercent, formatScore } from "../utils/format";
import { Panel } from "../components/ui/Panel";
import { FilterChip } from "../components/ui/FilterChip";
import { BadgePill } from "../components/ui/BadgePill";
import type { View } from "../types/navigation";

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
  rollups: PersonRollup[];
  summary: PersonnelSummary;
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: View) => void;
};

export const HomeScreen = ({ rollups, summary, onSelectPerson, onNavigate }: HomeScreenProps) => {
  const totalPersonnel = rollups.length;
  const visiblePeople = useMemo(() => rollups.slice(0, 11), [rollups]);
  const highlightedPeople = useMemo(() => visiblePeople.slice(0, 2), [visiblePeople]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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

  return (
    <section className="home">
      <div className="home-layout">
        <aside className="sidebar">
          <Panel title="Filters">
            <div className="filter-row">
              <button type="button" className="btn btn--ghost">
                Reset
              </button>
              <div className="filter-tabs">
                <button type="button" className="btn btn--chip">
                  Last 7d
                </button>
                <button type="button" className="btn btn--chip btn--active">
                  Last 30d
                </button>
                <button type="button" className="btn btn--chip">
                  Last 90d
                </button>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Date Range</div>
              <div className="date-row">
                <label className="input">
                  <span className="sr-only">Start date</span>
                  <input type="text" value="04/01/24" readOnly />
                </label>
                <span className="arrow">to</span>
                <label className="input">
                  <span className="sr-only">End date</span>
                  <input type="text" value="04/30/24" readOnly />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Locations</div>
              <div className="checkbox-list">
                {[
                  "Office A",
                  "Office B",
                  "Loading Dock",
                  "Main Entrance",
                  "Server Room",
                ].map((label) => (
                  <label key={label} className="checkbox">
                    <input type="checkbox" defaultChecked={label === "Office A"} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="toggle-row">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Include at least one</span>
                </label>
                <label className="checkbox">
                  <input type="checkbox" />
                  <span>Must include all</span>
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Device ID</div>
              <label className="input">
                <input type="text" placeholder="Search device" />
              </label>
            </div>

            <div className="filter-section">
              <div className="filter-title">Personnel</div>
              <label className="input">
                <input type="text" placeholder="Search name" />
              </label>
            </div>

            <div className="filter-section">
              <div className="filter-title">Anomaly Score</div>
              <input type="range" min={0} max={100} defaultValue={65} />
              <div className="range-labels">
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn--ghost">
                Clear All
              </button>
              <button type="button" className="btn btn--primary">
                Apply
              </button>
            </div>
          </Panel>
        </aside>

        <div className="home-main">
          <div className="kpi-row">
            <div className="kpi-mini">
              <div className="kpi-mini__label">Total Personnel</div>
              <div className="kpi-mini__value">{formatNumber(totalPersonnel)}</div>
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
            <FilterChip label="Office A" tone="active" />
            <FilterChip label="Last 30d" />
            <FilterChip label="Must include all" />
            <FilterChip label="Anomaly Score: 40-100" />
            <FilterChip label="Denied: Only" tone="active" />
            <span className="chip-row__meta">Showing {visiblePeople.length} of {totalPersonnel}</span>
          </div>

          <Panel title="Personnel">
            <div className="table-actions">
              <button type="button" className="btn btn--ghost btn--small">
                Filters
              </button>
              <button type="button" className="btn btn--ghost btn--small">
                Sort
              </button>
            </div>
            <div className="table">
              <table className="person-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Anomaly</th>
                    <th>Isolation Forest</th>
                    <th>Shannon Entropy</th>
                    <th>Denied Rate</th>
                    <th>Last Badge</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePeople.map((person) => (
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
                  <button type="button" className="btn btn--ghost btn--small">
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
