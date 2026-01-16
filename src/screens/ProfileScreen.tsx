import { useMemo, useState } from "react";
import type { PersonProfile, BadgeEvent } from "../data/types";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatPercent, formatScore } from "../utils/format";
import { BadgePill } from "../components/ui/BadgePill";
import { KpiTile } from "../components/ui/KpiTile";
import { Panel } from "../components/ui/Panel";
import { Tabs } from "../components/ui/Tabs";
import { StatusBanner } from "../components/ui/StatusBanner";
import { EmptyState } from "../components/ui/EmptyState";
import { ScreenHeader } from "../components/layout/ScreenHeader";

const entropyLabel = (value: number) => {
  if (value >= 2.6) return "Unusually High";
  if (value >= 1.9) return "Elevated";
  if (value >= 1.2) return "Normal";
  return "Low";
};

const percentDiffLabel = (value: number, avg: number) => {
  const diff = value - avg;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}% vs avg`;
};

type ProfileScreenProps = {
  person: PersonProfile;
  avgDeniedPercent: number;
  isoPercentile: number;
  anomalyPercentile: number;
};

export const ProfileScreen = ({
  person,
  avgDeniedPercent,
  isoPercentile,
  anomalyPercentile,
}: ProfileScreenProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const tabs = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "denied", label: "Denied" },
    { id: "after-hours", label: "After-Hours" },
    { id: "flagged", label: "Flagged" },
  ];

  const filteredEvents = useMemo(() => {
    const events = person.recentEvents;
    switch (activeTab) {
      case "approved":
        return events.filter((event) => event.outcome === "approved");
      case "denied":
        return events.filter((event) => event.outcome === "denied");
      case "after-hours":
        return events.filter((event) => event.flags.includes("After-Hours"));
      case "flagged":
        return events.filter((event) => event.flags.length > 0);
      default:
        return events;
    }
  }, [activeTab, person.recentEvents]);

  const groupedEvents = useMemo(() => {
    const map = new Map<string, BadgeEvent[]>();
    for (const event of filteredEvents) {
      const label = formatDate(event.timestamp);
      const group = map.get(label);
      if (group) {
        group.push(event);
      } else {
        map.set(label, [event]);
      }
    }
    return Array.from(map.entries()).map(([date, events]) => ({
      date,
      events,
    }));
  }, [filteredEvents]);

  const afterHoursCount = useMemo(() => {
    return person.recentEvents.filter((event) =>
      event.flags.includes("After-Hours")
    ).length;
  }, [person.recentEvents]);

  const afterHoursDays = useMemo(() => {
    const days = new Set(
      person.recentEvents
        .filter((event) => event.flags.includes("After-Hours"))
        .map((event) => formatDate(event.timestamp))
    );
    return days.size;
  }, [person.recentEvents]);

  const recentDenied = useMemo(() => {
    return person.recentEvents
      .filter((event) => event.outcome === "denied")
      .slice(0, 5);
  }, [person.recentEvents]);

  return (
    <section className="screen">
      <ScreenHeader
        title={<h1 className="screen-title">{person.name}</h1>}
        meta={[
          `Last Badge: ${formatDate(person.lastBadgeTimestamp)} ${formatTime(
            person.lastBadgeTimestamp
          )}`,
          `Active Window: ${person.activeWindowLabel}`,
          `Total Events: ${formatNumber(person.totalEvents)}`,
        ]}
      />

      <div className="kpi-grid">
        <KpiTile
          label="Anomaly Score"
          value={person.anomalyScore}
          sublabel={`${anomalyPercentile}th percentile`}
          accent={person.anomalyScore > 70 ? "danger" : "primary"}
        />
        <KpiTile
          label="Isolation Forest"
          value={formatScore(person.isolationForestScore, 2)}
          sublabel={`${isoPercentile}th percentile`}
          accent={person.isolationForestScore > 7 ? "warning" : "primary"}
        />
        <KpiTile
          label="Shannon Entropy"
          value={formatScore(person.shannonEntropy, 2)}
          sublabel={entropyLabel(person.shannonEntropy)}
        />
        <KpiTile
          label="Denied Rate"
          value={formatPercent(person.denialPercent, 1)}
          sublabel={percentDiffLabel(person.denialPercent, avgDeniedPercent)}
          accent={
            person.denialPercent > avgDeniedPercent + 5 ? "warning" : "primary"
          }
        />
        <KpiTile
          label="After-Hours Rate"
          value={`${afterHoursCount} / ${afterHoursDays}`}
          sublabel={formatPercent(person.afterHoursRate, 1)}
          accent={person.afterHoursRate > 18 ? "danger" : "primary"}
        />
      </div>

      <div className="profile-layout">
        <div className="profile-feed">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
          <div className="feed">
            {groupedEvents.length === 0 && (
              <EmptyState title="No events" description="Try another filter." />
            )}
            {groupedEvents.map((group) => (
              <div key={group.date} className="feed__group">
                <div className="feed__date">{group.date}</div>
                {group.events.map((event) => {
                  const isHighlighted = highlightedId === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      className={`feed__row ${
                        isHighlighted ? "feed__row--active" : ""
                      }`.trim()}
                      onClick={() => {
                        if (event.outcome === "denied") {
                          setHighlightedId(event.id);
                        }
                      }}
                    >
                      <div className="feed__time">
                        {formatTime(event.timestamp)}
                      </div>
                      <div className="feed__scanner">{event.scannerName}</div>
                      <div className="feed__pills">
                        <BadgePill
                          label={
                            event.outcome === "approved" ? "Approved" : "Denied"
                          }
                          variant={
                            event.outcome === "approved" ? "approved" : "denied"
                          }
                        />
                        {event.flags.map((flag) => (
                          <BadgePill
                            key={`${event.id}-${flag}`}
                            label={flag}
                            variant={
                              flag === "After-Hours" ? "after-hours" : "flag"
                            }
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="profile-side">
          <Panel title="Where Badged">
            <div className="list">
              {person.scannerLocations.slice(0, 6).map((location) => (
                <div key={location.locationId} className="list__row">
                  <span>{location.displayName}</span>
                  <span className="list__value">{location.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Badge Outcomes">
            <div className="outcomes">
              <div className="outcome">
                <span className="outcome__label">Approved </span>
                <span className="outcome__value">
                  {formatNumber(person.approvedCount)}
                </span>
              </div>
              <div className="outcome outcome--danger">
                <span className="outcome__label">Denied </span>
                <span className="outcome__value">
                  {formatNumber(person.deniedCount)}
                </span>
              </div>
            </div>
            <div className="subsection-title">Recent Denied Events</div>
            {recentDenied.length === 0 ? (
              <EmptyState title="No denied events" />
            ) : (
              <div className="list">
                {recentDenied.map((event) => (
                  <div key={`denied-${event.id}`} className="list__row">
                    <span>{event.scannerName}</span>
                    <span className="list__value">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <StatusBanner
        status={person.statusLabel}
        reasons={person.statusReasons}
      />
    </section>
  );
};
