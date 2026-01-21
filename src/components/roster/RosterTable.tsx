import type { KeyboardEvent } from "react";
import { EmptyState } from "../ui/EmptyState";
import type { MonthlyPersonSummary } from "../../data/types";
import { getSeverityFromModel, severityToTone } from "../../utils/severity";

export type SortKey =
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

export type SortDirection = "asc" | "desc";

type FormatterSet = {
  formatNumber: (value: number) => string;
  formatPercent: (value: number, precision?: number) => string;
  formatScore: (value: number, precision?: number) => string;
  formatAnomalyScore: (value: number, decimals?: number) => string;
  formatAnomalyScoreFull: (value: number, decimals?: number) => string;
  formatDate: (value: string) => string;
  formatTime: (value: string) => string;
};

type RosterTableProps = {
  rows: MonthlyPersonSummary[];
  sortKey: SortKey;
  sortDir: SortDirection;
  onSort: (key: SortKey) => void;
  highlightedId: string | null;
  onActivatePerson: (personId: string) => void;
  onRowKeyDown: (event: KeyboardEvent<HTMLDivElement>, personId: string) => void;
  formatters: FormatterSet;
};

const toAriaSort = (active: boolean, dir: SortDirection) => {
  if (!active) return "none";
  return dir === "asc" ? "ascending" : "descending";
};

export const RosterTable = ({
  rows,
  sortKey,
  sortDir,
  onSort,
  highlightedId,
  onActivatePerson,
  onRowKeyDown,
  formatters,
}: RosterTableProps) => {
  const {
    formatNumber,
    formatPercent,
    formatScore,
    formatAnomalyScore,
    formatAnomalyScoreFull,
    formatDate,
    formatTime,
  } = formatters;

  return (
    <section className="roster-table" role="table" aria-label="Personnel roster">
      <div className="roster-table__header" role="row">
        <div
          className="roster-cell roster-cell--name col--name col--tier1"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "name", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${sortKey === "name" ? `roster-th--sorted ${sortDir}` : ""}`.trim()}
            onClick={() => onSort("name")}
          >
            <span className="roster-name-header" aria-hidden="true">
              <span className="roster-name-header__spacer" />
              <span className="roster-th__label">Name</span>
            </span>
            <span className="sr-only">Name</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--anomaly col--tier1"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "anomalyScore", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "anomalyScore" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("anomalyScore")}
          >
            <span className="roster-th__label">Anomaly</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--entropy col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "shannonEntropy", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "shannonEntropy" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("shannonEntropy")}
          >
            <span className="roster-th__label">Entropy</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--denied col--tier1"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "deniedRate", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "deniedRate" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("deniedRate")}
          >
            <span className="roster-th__label">Denied Rate</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--after col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "afterHoursRate", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "afterHoursRate" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("afterHoursRate")}
            aria-label="After-Hours Rate"
          >
            <span className="roster-th__label">After Hrs</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--weekend col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "weekendRate", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "weekendRate" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("weekendRate")}
          >
            <span className="roster-th__label">Weekend</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--devices col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "uniqueDeviceCount", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "uniqueDeviceCount" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("uniqueDeviceCount")}
          >
            <span className="roster-th__label">Devices</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--rapid col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "rapidBadgingCount", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "rapidBadgingCount" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("rapidBadgingCount")}
          >
            <span className="roster-th__label">Rapid</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--days col--tier2"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "daysActive", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "daysActive" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("daysActive")}
          >
            <span className="roster-th__label">Days</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--date col--last col--tier1"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "lastEventTimestamp", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "lastEventTimestamp" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("lastEventTimestamp")}
            aria-label="Last Event"
          >
            <span className="roster-th__label">Last Badge</span>
          </button>
        </div>
      </div>

      <div className="roster-table__body" role="rowgroup">
        {rows.length === 0 ? (
          <EmptyState title="No results" description="Try adjusting filters." />
        ) : (
          rows.map((person) => {
            const severity = getSeverityFromModel({
              isAnomaly: person.isAnomaly,
              anomalyScore: person.anomalyScore,
            });
            const anomalyTone = severityToTone(severity);
            const anomalyDisplay = formatAnomalyScore(person.anomalyScore, 4);
            const anomalyFull = formatAnomalyScoreFull(person.anomalyScore, 6);
            return (
              <div
                key={`${person.monthKey}-${person.personId}`}
                role="row"
                tabIndex={0}
                aria-label={`Open ${person.name}`}
                className={`roster-row ${highlightedId === person.personId ? "row--active" : ""}`.trim()}
                onClick={() => onActivatePerson(person.personId)}
                onKeyDown={(event) => onRowKeyDown(event, person.personId)}
              >
                <div className="roster-cell roster-cell--name col--name col--tier1" role="cell">
                  <div className="roster-name">
                    <div className="avatar">{person.name.charAt(0)}</div>
                    <div className="roster-name__text">
                      <div className="roster-name__top">
                        <span className="roster-name__value">{person.name}</span>
                      </div>
                      <div className="roster-name__sub">{person.monthKey}</div>
                    </div>
                  </div>
                </div>
                <div className="roster-cell roster-cell--num col--anomaly col--tier1" role="cell">
                  <span
                    className={`anomaly-chip anomaly-chip--${anomalyTone}`}
                    title={anomalyFull}
                  >
                    {anomalyDisplay}
                  </span>
                </div>
                <div className="roster-cell roster-cell--num col--entropy col--tier2" role="cell">
                  {formatScore(person.shannonEntropy, 2)}
                </div>
                <div className="roster-cell roster-cell--num col--denied col--tier1" role="cell">
                  {formatPercent(person.deniedRate, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--after col--tier2" role="cell">
                  {formatPercent(person.afterHoursRate, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--weekend col--tier2" role="cell">
                  {formatPercent(person.weekendRate, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--devices col--tier2" role="cell">
                  {formatNumber(person.uniqueDeviceCount)}
                </div>
                <div className="roster-cell roster-cell--num col--rapid col--tier2" role="cell">
                  {formatNumber(person.rapidBadgingCount)}
                </div>
                <div className="roster-cell roster-cell--num col--days col--tier2" role="cell">
                  {formatNumber(person.badgedDays.length)}
                </div>
                <div className="roster-cell roster-cell--date col--last col--tier1" role="cell">
                  <div className="last-badge">
                    <span>{formatDate(person.lastEventTimestamp)}</span>
                    <span className="last-badge__time">{formatTime(person.lastEventTimestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
