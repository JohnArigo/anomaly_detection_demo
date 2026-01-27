import type { KeyboardEvent } from "react";
import type { JoinedRow } from "../../data/types";
import { formatDate, formatTime } from "../../utils/date";
import { anomalyLabel, anomalyTone, getAnomalyStatus } from "../../utils/severity";

type FormatterSet = {
  formatNumber: (value: number) => string;
  formatRate: (value: number, precision?: number) => string;
  formatScore: (value: number, precision?: number) => string;
};

type RosterCardsProps = {
  rows: JoinedRow[];
  highlightedId: string | null;
  onActivatePerson: (personId: string) => void;
  onRowKeyDown: (event: KeyboardEvent<HTMLElement>, personId: string) => void;
  formatters: FormatterSet;
};

export const RosterCards = ({
  rows,
  highlightedId,
  onActivatePerson,
  onRowKeyDown,
  formatters,
}: RosterCardsProps) => {
  const { formatNumber, formatRate, formatScore } = formatters;

  return (
    <div className="roster-cards">
      {rows.map((row) => {
        const status = getAnomalyStatus(row.is_anomaly);
        const tone = anomalyTone(status);
        return (
          <article
            key={`${row.cardholder_name}-${row.year}-${row.month}`}
            className={`roster-card ${highlightedId === row.cardholder_name ? "roster-card--active" : ""}`.trim()}
            tabIndex={0}
            role="button"
            aria-label={`Open profile for ${row.cardholder_name}`}
            onClick={() => onActivatePerson(row.cardholder_name)}
            onKeyDown={(event) => onRowKeyDown(event, row.cardholder_name)}
          >
            <div className="roster-card__top">
              <div className="roster-card__name">{row.cardholder_name}</div>
              <span className={`status-badge status-badge--${tone}`}>
                {anomalyLabel(status)}
              </span>
            </div>

            <div className="roster-card__meta">
              <span>
                Last badge {formatDate(row.last_event_time)} {formatTime(row.last_event_time)}
              </span>
              <span>{formatNumber(row.count_events)} events</span>
              <span>
                {row.year}-{String(row.month).padStart(2, "0")}
              </span>
            </div>

            <div className="roster-card__stats">
              <div className="stat-chip">
                <span className="stat-chip__label">iForest</span>
                <span className="stat-chip__value">{formatScore(row.iforest_score, 3)}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip__label">Denied</span>
                <span className="stat-chip__value">{formatRate(row.denial_rate, 1)}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip__label">Off Hours</span>
                <span className="stat-chip__value">{formatRate(row.off_hours_ratio, 1)}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip__label">Weekend</span>
                <span className="stat-chip__value">{formatRate(row.weekend_ratio, 1)}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip__label">Devices</span>
                <span className="stat-chip__value">{formatNumber(row.unique_devices)}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip__label">Time Std</span>
                <span className="stat-chip__value">
                  {formatScore(row.time_of_day_stddev, 2)}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
