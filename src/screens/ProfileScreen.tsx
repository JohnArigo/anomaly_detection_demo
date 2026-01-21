import { useEffect, useMemo, useRef, useState } from "react";
import type { BadgeEvent } from "../data/types";
import { formatDate, formatTime } from "../utils/date";
import { formatAnomalyScore, formatNumber, formatPercent, formatScore } from "../utils/format";
import { BadgePill } from "../components/ui/BadgePill";
import { KpiTile } from "../components/ui/KpiTile";
import { Panel } from "../components/ui/Panel";
import { Tabs } from "../components/ui/Tabs";
import { StatusBanner } from "../components/ui/StatusBanner";
import { EmptyState } from "../components/ui/EmptyState";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { badgeEvents, peopleBase } from "../data/mock";
import { buildMonthlySummaries, getMonthlyRow, toMonthKey } from "../data/monthly";
import { percentileRank } from "../utils/math";
import {
  getSeverityFromModel,
  severityLabel,
  severityToKpiAccent,
  SEVERITY_THRESHOLDS,
  type Severity,
} from "../utils/severity";
import { locationStats } from "../data/metrics";

type ProfileScreenProps = {
  personId: string | null;
  monthKey: string;
  denialModalOpen: boolean;
  onOpenDenialModal: (personId: string, monthKey: string, highlightedEventId?: string | null) => void;
};

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

const deriveStatus = (params: {
  anomalyScore: number;
  isAnomaly: number;
  deniedRate: number;
  afterHoursRate: number;
  rapidBadgingCount: number;
}) => {
  const reasons: string[] = [];
  if (params.deniedRate > 14) reasons.push("High denied rate");
  if (params.afterHoursRate > 18) reasons.push("After-hours surge");
  if (params.rapidBadgingCount > 6) reasons.push("Rapid repeat attempts");
  if (params.anomalyScore <= SEVERITY_THRESHOLDS.watch) reasons.push("Anomaly score elevated");

  const severity: Severity = getSeverityFromModel({
    isAnomaly: params.isAnomaly,
    anomalyScore: params.anomalyScore,
  });
  return {
    severity,
    statusLabel: severityLabel(severity),
    reasons: reasons.length === 0 ? ["Within expected baseline"] : reasons,
  };
};

export const ProfileScreen = ({
  personId,
  monthKey,
  denialModalOpen,
  onOpenDenialModal,
}: ProfileScreenProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [openedFromKpi, setOpenedFromKpi] = useState(false);
  const deniedRateRef = useRef<HTMLDivElement | null>(null);
  const prevModalOpen = useRef(denialModalOpen);

  const monthlyRows = useMemo(
    () => buildMonthlySummaries(peopleBase, badgeEvents, monthKey),
    [monthKey],
  );
  const monthlyRow = useMemo(
    () => getMonthlyRow(personId, monthKey, peopleBase, badgeEvents),
    [personId, monthKey],
  );

  const avgDeniedRate = useMemo(() => {
    if (monthlyRows.length === 0) return 0;
    const total = monthlyRows.reduce((sum, row) => sum + row.deniedRate, 0);
    return total / monthlyRows.length;
  }, [monthlyRows]);

  const anomalyScores = useMemo(
    () => monthlyRows.map((row) => row.anomalyScore),
    [monthlyRows],
  );

  if (!monthlyRow) {
    return (
      <section className="screen">
        <EmptyState title="Select a person" description="Choose a person from Home or the selector." />
      </section>
    );
  }

  const anomalyPercentile = percentileRank(anomalyScores, monthlyRow.anomalyScore);

  const drilldownEvents = useMemo(() => {
    if (!personId) return [];
    return badgeEvents
      .filter((event) => event.personId === personId && toMonthKey(event.timestamp) === monthKey)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [personId, monthKey]);

  const filteredEvents = useMemo(() => {
    const events = drilldownEvents;
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
  }, [activeTab, drilldownEvents]);

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
    return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
  }, [filteredEvents]);

  const recentDenied = useMemo(() => {
    return drilldownEvents.filter((event) => event.outcome === "denied").slice(0, 5);
  }, [drilldownEvents]);

  const scannerLocations = useMemo(
    () => locationStats(drilldownEvents).slice(0, 6),
    [drilldownEvents],
  );

  const status = deriveStatus({
    anomalyScore: monthlyRow.anomalyScore,
    isAnomaly: monthlyRow.isAnomaly,
    deniedRate: monthlyRow.deniedRate,
    afterHoursRate: monthlyRow.afterHoursRate,
    rapidBadgingCount: monthlyRow.rapidBadgingCount,
  });
  const severity = status.severity;

  useEffect(() => {
    if (prevModalOpen.current && !denialModalOpen && openedFromKpi) {
      deniedRateRef.current?.focus();
    }
    prevModalOpen.current = denialModalOpen;
  }, [denialModalOpen, openedFromKpi]);

  const openDeniedFromKpi = () => {
    setOpenedFromKpi(true);
    onOpenDenialModal(monthlyRow.personId, monthKey);
  };

  return (
    <section className="screen">
      <ScreenHeader
        title={<h1 className="screen-title">{monthlyRow.name}</h1>}
        meta={[
          `Last Badge: ${formatDate(monthlyRow.lastEventTimestamp)} ${formatTime(
            monthlyRow.lastEventTimestamp,
          )}`,
          `Month: ${monthKey}`,
          `Total Events: ${formatNumber(monthlyRow.totalEvents)}`,
        ]}
      />

      <div className="kpi-grid">
        <KpiTile
          kpiId="anomalyScore"
          value={formatAnomalyScore(monthlyRow.anomalyScore, 4)}
          sublabel={`${anomalyPercentile}th percentile`}
          accent={severityToKpiAccent(severity)}
        />
        <KpiTile
          kpiId="shannonEntropy"
          value={formatScore(monthlyRow.shannonEntropy, 2)}
          sublabel={entropyLabel(monthlyRow.shannonEntropy)}
          accent={severityToKpiAccent(severity)}
        />
        <KpiTile
          kpiId="deniedRate"
          value={formatPercent(monthlyRow.deniedRate, 1)}
          sublabel={percentDiffLabel(monthlyRow.deniedRate, avgDeniedRate)}
          accent={severityToKpiAccent(severity)}
          comparison={percentDiffLabel(monthlyRow.deniedRate, avgDeniedRate)}
          onActivate={openDeniedFromKpi}
          ariaLabel="Open denial breakdown"
          tileRef={deniedRateRef}
        />
        <KpiTile
          kpiId="afterHoursRate"
          value={formatPercent(monthlyRow.afterHoursRate, 1)}
          sublabel={formatPercent(monthlyRow.afterHoursRate, 1)}
          accent={severityToKpiAccent(severity)}
        />
        <KpiTile
          kpiId="weekendRate"
          value={formatPercent(monthlyRow.weekendRate, 1)}
          sublabel={formatPercent(monthlyRow.weekendRate, 1)}
          accent={severityToKpiAccent(severity)}
        />
      </div>

      <div className="profile-layout">
        <div className="profile-feed">
          <Tabs
            tabs={[
              { id: "all", label: "All" },
              { id: "approved", label: "Approved" },
              { id: "denied", label: "Denied" },
              { id: "after-hours", label: "After-Hours" },
              { id: "flagged", label: "Flagged" },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
          <div className="feed">
            {groupedEvents.length === 0 && (
              <EmptyState title="No events" description="No drilldown activity for this month." />
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
                      className={`feed__row ${isHighlighted ? "feed__row--active" : ""}`.trim()}
                      onClick={() => {
                        if (event.outcome === "denied") {
                          setHighlightedId(event.id);
                          setOpenedFromKpi(false);
                          onOpenDenialModal(monthlyRow.personId, monthKey, event.id);
                        }
                      }}
                    >
                      <div className="feed__time">{formatTime(event.timestamp)}</div>
                      <div className="feed__scanner">{event.scannerName}</div>
                      <div className="feed__pills">
                        <BadgePill
                          label={event.outcome === "approved" ? "Approved" : "Denied"}
                          variant={event.outcome === "approved" ? "approved" : "denied"}
                        />
                        {event.flags.map((flag) => (
                          <BadgePill
                            key={`${event.id}-${flag}`}
                            label={flag}
                            variant={flag === "After-Hours" ? "after-hours" : "flag"}
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
              {scannerLocations.length === 0 && <EmptyState title="No locations" />}
              {scannerLocations.map((location) => (
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
                <span className="outcome__label">Approved</span>
                <span className="outcome__value">{formatNumber(monthlyRow.acceptedCount)}</span>
              </div>
              <div className="outcome outcome--danger">
                <span className="outcome__label">Denied</span>
                <span className="outcome__value">{formatNumber(monthlyRow.deniedCount)}</span>
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
                    <span className="list__value">{formatTime(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <StatusBanner severity={severity} reasons={status.reasons} />
    </section>
  );
};
