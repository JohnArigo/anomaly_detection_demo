import { useMemo, useState } from "react";
import type { BaseEvent, DeviceScan, JoinedRow } from "../../data/types";
import { Tabs } from "../ui/Tabs";
import { formatNumber } from "../../utils/format";

type EvidenceExplorerProps = {
  row: JoinedRow;
};

const safeParse = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const EvidenceExplorer = ({ row }: EvidenceExplorerProps) => {
  const [activeTab, setActiveTab] = useState("events");

  const events = useMemo(() => {
    if (activeTab !== "events") return null;
    return safeParse<BaseEvent[]>(row.all_events) ?? [];
  }, [activeTab, row.all_events]);

  const devices = useMemo(() => {
    if (activeTab !== "devices") return null;
    return safeParse<DeviceScan[]>(row.unique_device_scans) ?? [];
  }, [activeTab, row.unique_device_scans]);

  return (
    <div className="evidence">
      <Tabs
        tabs={[
          { id: "events", label: "All events" },
          { id: "devices", label: "Device scans" },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "events" && (
        <div className="evidence__table">
          {events && events.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Outcome</th>
                  <th>Device</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={`${event.timestamp}-${index}`}>
                    <td>{event.timestamp}</td>
                    <td>{event.event_type}</td>
                    <td>{event.outcome}</td>
                    <td>{event.device}</td>
                    <td>{event.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="evidence__empty">No events available.</div>
          )}
        </div>
      )}

      {activeTab === "devices" && (
        <div className="evidence__table">
          {devices && devices.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Scan Count</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.device}>
                    <td>{device.device}</td>
                    <td>{formatNumber(device.scan_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="evidence__empty">No device scans available.</div>
          )}
        </div>
      )}
    </div>
  );
};
