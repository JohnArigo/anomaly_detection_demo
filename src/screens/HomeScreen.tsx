import { useMemo, useRef, useState } from "react";
import type { JoinedRow } from "../data/types";
import type { View } from "../types/navigation";
import { Panel } from "../components/ui/Panel";
import { FilterChip } from "../components/ui/FilterChip";
import { FilterDrawer } from "../components/filters/FilterDrawer";
import { PersonCombobox } from "../components/PersonCombobox";
import { RosterCards } from "../components/roster/RosterCards";
import { formatNumber, formatRate, formatScore } from "../utils/format";

type HomeScreenProps = {
  rows: JoinedRow[];
  activeMonthKey: string;
  monthOptions: string[];
  onMonthChange: (monthKey: string) => void;
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: View) => void;
};

type StatusFilter = "all" | "flagged" | "normal";

type HomeFilters = {
  nameQuery: string;
  status: StatusFilter;
};

type SortKey = "iforest_score" | "denial_rate" | "off_hours_ratio" | "weekend_ratio" | "count_events";
type SortDirection = "asc" | "desc";

const defaultFilters: HomeFilters = {
  nameQuery: "",
  status: "all",
};

const sortRows = (rows: JoinedRow[], key: SortKey, dir: SortDirection) => {
  const next = [...rows];
  const order = dir === "asc" ? 1 : -1;
  next.sort((a, b) => order * (Number(a[key]) - Number(b[key])));
  return next;
};

export const HomeScreen = ({
  rows,
  activeMonthKey,
  monthOptions,
  onMonthChange,
  onSelectPerson,
  onNavigate,
}: HomeScreenProps) => {
  const [filters, setFilters] = useState<HomeFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("iforest_score");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const rosterOptions = useMemo(
    () =>
      rows.map((person) => ({
        value: person.cardholder_name,
        label: person.cardholder_name,
      })),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const nameQuery = filters.nameQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (nameQuery && !row.cardholder_name.toLowerCase().includes(nameQuery)) return false;
      if (filters.status === "flagged" && row.is_anomaly !== 1) return false;
      if (filters.status === "normal" && row.is_anomaly !== 0) return false;
      return true;
    });
  }, [filters, rows]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nameQuery.trim()) count += 1;
    if (filters.status !== "all") count += 1;
    return count;
  }, [filters]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortKey, sortDir),
    [filteredRows, sortKey, sortDir],
  );

  const pageRows = useMemo(() => sortedRows.slice(0, 100), [sortedRows]);

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

  const activatePerson = (personId: string) => {
    onSelectPerson(personId);
    onNavigate("profile");
    setHighlightedId(personId);
    window.setTimeout(() => setHighlightedId(null), 700);
  };

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLElement>, personId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activatePerson(personId);
    }
  };

  return (
    <section className="home">
      <div className="home-layout">
        <div className="home-main">
          <div className="home-toolbar">
            <div>
              <div className="home-title">Monthly Personnel Roster</div>
              <div className="home-subtitle">Active month: {activeMonthKey}</div>
            </div>
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
            {filters.status !== "all" && (
              <FilterChip
                label={`Status: ${filters.status}`}
                onRemove={() => setFilters((prev) => ({ ...prev, status: "all" }))}
              />
            )}
          </div>

          <div className="sort-row">
            <button
              type="button"
              className={`sort-pill ${sortKey === "iforest_score" ? "sort-pill--active" : ""}`.trim()}
              onClick={() => onSort("iforest_score")}
            >
              iForest {sortKey === "iforest_score" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </button>
            <button
              type="button"
              className={`sort-pill ${sortKey === "denial_rate" ? "sort-pill--active" : ""}`.trim()}
              onClick={() => onSort("denial_rate")}
            >
              Denied {sortKey === "denial_rate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </button>
            <button
              type="button"
              className={`sort-pill ${sortKey === "off_hours_ratio" ? "sort-pill--active" : ""}`.trim()}
              onClick={() => onSort("off_hours_ratio")}
            >
              Off Hours {sortKey === "off_hours_ratio" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </button>
            <button
              type="button"
              className={`sort-pill ${sortKey === "weekend_ratio" ? "sort-pill--active" : ""}`.trim()}
              onClick={() => onSort("weekend_ratio")}
            >
              Weekend {sortKey === "weekend_ratio" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </button>
            <button
              type="button"
              className={`sort-pill ${sortKey === "count_events" ? "sort-pill--active" : ""}`.trim()}
              onClick={() => onSort("count_events")}
            >
              Events {sortKey === "count_events" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </button>
          </div>

          <Panel title="Personnel" className="panel--ghost">
            <RosterCards
              rows={pageRows}
              highlightedId={highlightedId}
              onActivatePerson={activatePerson}
              onRowKeyDown={onRowKeyDown}
              formatters={{
                formatNumber,
                formatRate,
                formatScore,
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
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, nameQuery: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="filter-section">
            <div className="filter-title">Anomaly Status</div>
            <label className="select">
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value as StatusFilter }))
                }
                aria-label="Filter by anomaly status"
              >
                <option value="all">All statuses</option>
                <option value="flagged">Flagged</option>
                <option value="normal">Normal</option>
              </select>
            </label>
          </div>

          <div className="filter-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setFilters(defaultFilters)}>
              Clear All
            </button>
          </div>
        </div>
      </FilterDrawer>
    </section>
  );
};
