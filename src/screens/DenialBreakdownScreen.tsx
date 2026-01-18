import { useMemo } from "react";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatPercent } from "../utils/format";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Panel } from "../components/ui/Panel";
import { DonutChart } from "../components/ui/DonutChart";
import { BadgePill } from "../components/ui/BadgePill";
import { IconButton } from "../components/ui/IconButton";
import { EmptyState } from "../components/ui/EmptyState";
import { badgeEvents, peopleBase } from "../data/mock";
import { getPersonById } from "../data/selectors";

const reasonColors: Record<string, string> = {
  "Expired Badge": "var(--danger)",
  "Time Restricted": "var(--warn)",
  "Invalid Entry Code": "var(--accent)",
  "No Access": "var(--muted-strong)",
  Unknown: "var(--muted)",
};

type DenialBreakdownScreenProps = {
  personId: string | null;
  highlightedEventId: string | null;
};

export const DenialBreakdownScreen = ({
  personId,
  highlightedEventId,
}: DenialBreakdownScreenProps) => {
  const person = useMemo(() => getPersonById(personId, peopleBase, badgeEvents), [personId]);

  if (!person) {
    return (
      <section className="screen">
        <EmptyState title="Select a person" description="Choose a person to view denial details." />
      </section>
    );
  }

  const totalDenied = person.deniedCount;
  const donutData = person.denialReasons.map((reason) => ({
    label: reason.reason,
    value: reason.count,
    color: reasonColors[reason.reason] ?? "var(--muted)",
  }));

  return (
    <section className="screen">
      <ScreenHeader
        title={<h1 className="screen-title">Badge Denial Breakdown</h1>}
        meta={[
          `Last Badge: ${formatDate(person.lastBadgeTimestamp)} ${formatTime(
            person.lastBadgeTimestamp,
          )}`,
          `Total Denied Attempts: ${formatNumber(totalDenied)}`,
        ]}
      />

      <div className="denial-layout">
        <Panel title="Denied Attempts">
          <div className="denial-chart">
            <DonutChart data={donutData} totalLabel="Denied" />
          </div>
        </Panel>

        <Panel title="Denial Reasons">
          {person.denialReasons.length === 0 ? (
            <EmptyState title="No denied events" description="No breakdown available." />
          ) : (
            <div className="list">
              {person.denialReasons.map((reason) => (
                <div key={reason.reason} className="list__row">
                  <span className="list__label">{reason.reason}</span>
                  <span className="list__value">
                    {formatNumber(reason.count)}
                    <span className="list__muted">
                      {formatPercent(
                        totalDenied === 0 ? 0 : (reason.count / totalDenied) * 100,
                        1,
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="subsection-title">Top Flags</div>
          {person.topFlags.length === 0 ? (
            <EmptyState title="No flags" />
          ) : (
            <div className="list">
              {person.topFlags.slice(0, 6).map((flag) => (
                <div key={flag.flag} className="list__row">
                  <span className="list__label">{flag.flag}</span>
                  <span className="list__value">{formatNumber(flag.count)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Summary Mirror" className="denial-mirror">
          <div className="subsection-title">Denial Reasons</div>
          <div className="list">
            {person.denialReasons.slice(0, 4).map((reason) => (
              <div key={`mirror-${reason.reason}`} className="list__row">
                <span>{reason.reason}</span>
                <span className="list__value">{formatNumber(reason.count)}</span>
              </div>
            ))}
            {person.denialReasons.length === 0 && <EmptyState title="No denies" />}
          </div>
          <div className="subsection-title">Top Flags</div>
          <div className="list">
            {person.topFlags.slice(0, 4).map((flag) => (
              <div key={`mirror-flag-${flag.flag}`} className="list__row">
                <span>{flag.flag}</span>
                <span className="list__value">{formatNumber(flag.count)}</span>
              </div>
            ))}
            {person.topFlags.length === 0 && <EmptyState title="No flags" />}
          </div>
        </Panel>
      </div>

      <Panel title="Most Recent Denied Events">
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Scanner</th>
                <th>Denial Reason</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {person.recentEvents
                .filter((event) => event.outcome === "denied")
                .slice(0, 12)
                .map((event) => (
                  <tr
                    key={event.id}
                    className={highlightedEventId === event.id ? "row--active" : undefined}
                  >
                    <td>{`${formatDate(event.timestamp)} ${formatTime(event.timestamp)}`}</td>
                    <td>{event.scannerName}</td>
                    <td>{event.denialReason ?? "Unknown"}</td>
                    <td>
                      <div className="table__pills">
                        {event.flags.length === 0 && (
                          <BadgePill label="None" variant="neutral" />
                        )}
                        {event.flags.map((flag) => (
                          <BadgePill
                            key={`${event.id}-${flag}`}
                            label={flag}
                            variant={flag === "After-Hours" ? "after-hours" : "flag"}
                          />
                        ))}
                      </div>
                    </td>
                    <td>
                      <IconButton label="Dismiss" icon="X" />
                    </td>
                  </tr>
                ))}
              {person.deniedCount === 0 && (
                <tr>
                  <td colSpan={5} className="table__empty">
                    No denied events available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
};
