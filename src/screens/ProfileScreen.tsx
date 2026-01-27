import { useMemo, useState } from "react";
import type { BaseEvent, JoinedRow } from "../data/types";
import { formatDate, formatTime } from "../utils/date";
import { formatNumber, formatRate, formatScore } from "../utils/format";
import { BadgePill } from "../components/ui/BadgePill";
import { KpiTile } from "../components/ui/KpiTile";
import { Panel } from "../components/ui/Panel";
import { Tabs } from "../components/ui/Tabs";
import { StatusBanner } from "../components/ui/StatusBanner";
import { EmptyState } from "../components/ui/EmptyState";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { getJoinedRow, toMonthKey } from "../data/join";
import { anomalyLabel, anomalyTone, getAnomalyStatus } from "../utils/severity";
import { getEventTypeCounts } from "../utils/dynamicCounts";
import { LLMSummaryModal } from "../components/profile/LLMSummaryModal";

type ProfileScreenProps = {
  rows: JoinedRow[];
  personId: string | null;
  monthKey: string;
  onOpenDenialModal: (personId: string, monthKey: string) => void;
};

const safeParse = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const ProfileScreen = ({
  rows,
  personId,
  monthKey,
  onOpenDenialModal,
}: ProfileScreenProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showAllCounts, setShowAllCounts] = useState(false);

  const row = useMemo(() => getJoinedRow(rows, personId, monthKey), [rows, personId, monthKey]);

  const isAfterHours = (timestamp: string) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    return hour < 6 || hour >= 20;
  };

  const isWeekend = (timestamp: string) => {
    const day = new Date(timestamp).getDay();
    return day === 0 || day === 6;
  };

  const events = useMemo(() => {
    if (!row) return [];
    if (activeTab === "summary") return [];
    const parsed = safeParse<BaseEvent[]>(row.all_events) ?? [];
    if (activeTab === "denied") {
      return parsed.filter((event) => event.outcome.toLowerCase().includes("denied"));
    }
    if (activeTab === "after-hours") {
      return parsed.filter((event) => isAfterHours(event.timestamp));
    }
    if (activeTab === "weekend") {
      return parsed.filter((event) => isWeekend(event.timestamp));
    }
    return parsed;
  }, [row, activeTab]);

  const groupedEvents = useMemo(() => {
    const map = new Map<string, BaseEvent[]>();
    for (const event of events) {
      const label = formatDate(event.timestamp);
      const group = map.get(label);
      if (group) {
        group.push(event);
      } else {
        map.set(label, [event]);
      }
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [events]);

  if (!row) {
    return (
      <section className="screen">
        <EmptyState title="Select a person" description="Choose a person from Home or the selector." />
      </section>
    );
  }

  const status = getAnomalyStatus(row.is_anomaly);
  const tone = anomalyTone(status);
  const bannerTone = status === "flagged" ? "danger" : "normal";
  const eventTypeCounts = getEventTypeCounts(row);
  const visibleCounts = showAllCounts ? eventTypeCounts : eventTypeCounts.slice(0, 6);
  const reasons =
    row.is_anomaly === 1
      ? ["Model flagged this month"]
      : ["Within expected operating range"];

  return (
    <section className="screen screen--profile">
      <ScreenHeader
        title={<h1 className="screen-title">{row.cardholder_name}</h1>}
        meta={[
          `Last Badge: ${formatDate(row.last_event_time)} ${formatTime(row.last_event_time)}`,
          `Month: ${toMonthKey(row.year, row.month)}`,
          `Total Events: ${formatNumber(row.count_events)}`,
          <span key="summary" className="profile-header-action">
            <button
              type="button"
              className="btn btn--ghost profile-summary-button"
              onClick={() => setSummaryOpen(true)}
            >
              Summary
            </button>
          </span>,
        ]}
      />

      <div className="kpi-grid">
        <KpiTile
          kpiId="iforestScore"
          value={formatScore(row.iforest_score, 3)}
          sublabel={row.is_anomaly === 1 ? "Flagged" : "Normal"}
          accent={tone === "danger" ? "danger" : "primary"}
        />
        <KpiTile
          kpiId="denialRate"
          value={formatRate(row.denial_rate, 1)}
          sublabel="Share of denied attempts"
          accent={tone === "danger" ? "danger" : "primary"}
          onActivate={() => onOpenDenialModal(row.cardholder_name, monthKey)}
          ariaLabel="Open denial breakdown"
        />
        <KpiTile
          kpiId="offHoursRatio"
          value={formatRate(row.off_hours_ratio, 1)}
          sublabel="Off-hours activity"
          accent={tone === "danger" ? "warning" : "primary"}
        />
        <KpiTile
          kpiId="weekendRatio"
          value={formatRate(row.weekend_ratio, 1)}
          sublabel="Weekend activity"
          accent={tone === "danger" ? "warning" : "primary"}
        />
        <KpiTile
          kpiId="countEvents"
          value={formatNumber(row.count_events)}
          sublabel="Monthly volume"
          accent="primary"
        />
      </div>

      <div className="profile-layout">
        <div className="profile-feed" id="evidence-explorer">
          <Tabs
            tabs={[
              { id: "all", label: "All Events" },
              { id: "denied", label: "Denied" },
              { id: "after-hours", label: "After-Hours" },
              { id: "weekend", label: "Weekend" },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
          <div className="feed">
            {groupedEvents.length === 0 && (
              <EmptyState title="No events" description="No evidence loaded for this tab." />
            )}
            {groupedEvents.map((group) => (
              <div key={group.date} className="feed__group">
                <div className="feed__date">{group.date}</div>
                {group.items.map((event, index) => (
                  <button
                    key={`${event.timestamp}-${index}`}
                    type="button"
                    className="feed__row"
                  >
                    <div className="feed__time">{formatTime(event.timestamp)}</div>
                    <div className="feed__scanner">{event.location}</div>
                    <div className="feed__pills">
                      <BadgePill
                        label={event.outcome}
                        variant={event.outcome.toLowerCase().includes("denied") ? "denied" : "approved"}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="profile-side">
          <Panel title="Event-Type Counts">
            <div className="highlight-list">
              {eventTypeCounts.length === 0 && <EmptyState title="No event counts" />}
              {visibleCounts.map((item) => (
                <div key={item.key} className="highlight-row">
                  <span>{item.label}</span>
                  <span className="list__value">{formatNumber(item.count)}</span>
                </div>
              ))}
              {eventTypeCounts.length > 6 && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setShowAllCounts((prev) => !prev)}
                >
                  {showAllCounts ? "Show less" : "Show all"}
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Badge Outcomes">
            <div className="outcomes">
              <div className="outcome">
                <span className="outcome__label">Granted</span>
                <span className="outcome__value">
                  {formatNumber(Number(row.Granted_count ?? 0))}
                </span>
              </div>
              <div className="outcome outcome--danger">
                <span className="outcome__label">Denied</span>
                <span className="outcome__value">
                  {formatNumber(Number(row.Denied_count ?? 0))}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <StatusBanner statusLabel={anomalyLabel(status)} reasons={reasons} tone={bannerTone} />

      <LLMSummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        personName={row.cardholder_name}
        monthKey={toMonthKey(row.year, row.month)}
        iforestScore={row.iforest_score}
        isAnomaly={row.is_anomaly}
        llmResponseJsonString={row.llm_summary_json}
        onOpenEvidence={() => {
          setSummaryOpen(false);
          setActiveTab("all");
          window.requestAnimationFrame(() => {
            document.getElementById("evidence-explorer")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }}
      />
    </section>
  );
};
