import type { KeyboardEvent } from "react";
import type { JoinedRow } from "../../data/types";
import { EmptyState } from "../ui/EmptyState";
import { anomalyLabel, anomalyTone, getAnomalyStatus } from "../../utils/severity";

export type SortKey =
  | "name"
  | "count_events"
  | "denial_rate"
  | "weekend_ratio"
  | "off_hours_ratio"
  | "iforest_score";

export type SortDirection = "asc" | "desc";

type FormatterSet = {
  formatNumber: (value: number) => string;
  formatRate: (value: number, precision?: number) => string;
  formatScore: (value: number, precision?: number) => string;
  formatMonthKey: (year: number, month: number) => string;
};

type RosterTableProps = {
  rows: JoinedRow[];
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
  const { formatNumber, formatRate, formatScore, formatMonthKey } = formatters;

  return (
    <section className="roster-table" role="table" aria-label="Monthly roster">
      <div className="roster-table__header" role="row">
        <div
          className="roster-cell roster-cell--name col--name"
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
        <div className="roster-cell col--status" role="columnheader">
          <span className="roster-th roster-th--static">
            <span className="roster-th__label">Status</span>
          </span>
        </div>
        <div
          className="roster-cell roster-cell--num col--events"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "count_events", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "count_events" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("count_events")}
          >
            <span className="roster-th__label">Events</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--denial"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "denial_rate", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "denial_rate" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("denial_rate")}
          >
            <span className="roster-th__label">Denial Rate</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--weekend"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "weekend_ratio", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "weekend_ratio" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("weekend_ratio")}
          >
            <span className="roster-th__label">Weekend</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--offhours"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "off_hours_ratio", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "off_hours_ratio" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("off_hours_ratio")}
          >
            <span className="roster-th__label">Off Hours</span>
          </button>
        </div>
        <div
          className="roster-cell roster-cell--num col--iforest"
          role="columnheader"
          aria-sort={toAriaSort(sortKey === "iforest_score", sortDir)}
        >
          <button
            type="button"
            className={`roster-th ${
              sortKey === "iforest_score" ? `roster-th--sorted ${sortDir}` : ""
            }`.trim()}
            onClick={() => onSort("iforest_score")}
          >
            <span className="roster-th__label">iForest</span>
          </button>
        </div>
      </div>

      <div className="roster-table__body" role="rowgroup">
        {rows.length === 0 ? (
          <EmptyState title="No results" description="Try a different filter." />
        ) : (
          rows.map((row) => {
            const status = getAnomalyStatus(row.is_anomaly);
            const tone = anomalyTone(status);
            return (
              <div
                key={`${row.cardholder_name}-${row.year}-${row.month}`}
                role="row"
                tabIndex={0}
                aria-label={`Open ${row.cardholder_name}`}
                className={`roster-row ${highlightedId === row.cardholder_name ? "row--active" : ""}`.trim()}
                onClick={() => onActivatePerson(row.cardholder_name)}
                onKeyDown={(event) => onRowKeyDown(event, row.cardholder_name)}
              >
                <div className="roster-cell roster-cell--name col--name" role="cell">
                  <div className="roster-name">
                    <div className="avatar">{row.cardholder_name.charAt(0)}</div>
                    <div className="roster-name__text">
                      <div className="roster-name__value">{row.cardholder_name}</div>
                      <div className="roster-name__sub">
                        {formatMonthKey(row.year, row.month)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="roster-cell col--status" role="cell">
                  <span className={`status-badge status-badge--${tone}`}>
                    {anomalyLabel(status)}
                  </span>
                </div>
                <div className="roster-cell roster-cell--num col--events" role="cell">
                  {formatNumber(row.count_events)}
                </div>
                <div className="roster-cell roster-cell--num col--denial" role="cell">
                  {formatRate(row.denial_rate, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--weekend" role="cell">
                  {formatRate(row.weekend_ratio, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--offhours" role="cell">
                  {formatRate(row.off_hours_ratio, 1)}
                </div>
                <div className="roster-cell roster-cell--num col--iforest" role="cell">
                  {formatScore(row.iforest_score, 3)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
