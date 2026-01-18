import { useMemo } from "react";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatPercent } from "../utils/format";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Panel } from "../components/ui/Panel";
import { DonutChart } from "../components/ui/DonutChart";
import { BadgePill } from "../components/ui/BadgePill";
import { Table } from "../components/ui/Table";
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
};

export const DenialBreakdownScreen = ({ personId }: DenialBreakdownScreenProps) => {
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

  const deniedRows = useMemo(() => {
    return person.recentEvents
      .filter((event) => event.outcome === "denied")
      .slice(0, 12)
      .map((event) => [
        `${formatDate(event.timestamp)} ${formatTime(event.timestamp)}`,
        event.scannerName,
        event.denialReason ?? "Unknown",
        <div key={`flags-${event.id}`} className="table__pills">
          {event.flags.length === 0 && <BadgePill label="None" variant="neutral" />}
          {event.flags.map((flag) => (
            <BadgePill
              key={`${event.id}-${flag}`}
              label={flag}
              variant={flag === "After-Hours" ? "after-hours" : "flag"}
            />
          ))}
        </div>,
        <IconButton key={`icon-${event.id}`} label="Dismiss" icon="X" />,
      ]);
  }, [person.recentEvents]);

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
        <Table
          ariaLabel="Most recent denied events"
          headers={["Timestamp", "Scanner", "Denial Reason", "Flags", ""]}
          rows={deniedRows}
        />
      </Panel>
    </section>
  );
};
