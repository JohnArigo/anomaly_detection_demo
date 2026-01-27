import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { EmptyState } from "../ui/EmptyState";
import { getAnomalyStatus } from "../../utils/severity";
import { formatScore } from "../../utils/format";
import { parseJsonSafely } from "../../utils/json";
import { formatDate, formatTime } from "../../utils/date";

type LLMSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  monthKey: string;
  iforestScore: number;
  isAnomaly: number;
  llmResponseJsonString: string | null;
  onOpenEvidence: () => void;
};

type ReportObject = Record<string, unknown>;
type Tone = "danger" | "warn" | "good" | "neutral";
type PeerContext = { label: string; tone: "warn" | "good" | "neutral"; limited: boolean };

const isRecord = (value: unknown): value is ReportObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getString = (value: unknown) => (value === undefined || value === null ? "" : String(value));
const getBool = (value: unknown) => Boolean(value);

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const getDetectionStatus = (isAnomaly: number) => {
  if (isAnomaly === 1) {
    return { label: "FLAGGED", tone: "danger" as const };
  }
  return { label: "NORMAL", tone: "good" as const };
};

const getPeerContextLabel = (report: ReportObject): PeerContext | null => {
  const meta = isRecord(report.meta) ? report.meta : null;
  const status = meta && isRecord(meta.status) ? meta.status : null;
  const label = status ? getString(status.label).toLowerCase() : "";
  const neighbor = meta && isRecord(meta.neighbor_baseline) ? meta.neighbor_baseline : null;
  const kValue = neighbor?.k !== undefined ? Number(neighbor.k) : null;
  const limited = kValue !== null && kValue < 5;

  if (label) {
    if (includesAny(label, ["typical", "within", "good"])) {
      return { label: "Within peer norms", tone: "good", limited };
    }
    if (includesAny(label, ["slightly", "unusual", "alert"])) {
      return { label: "Higher than peers", tone: "warn", limited };
    }
  }

  const findings = Array.isArray(report.key_findings) ? report.key_findings : [];
  let higher = 0;
  let lower = 0;
  let neutral = 0;
  let higherRisk = 0;

  for (const finding of findings) {
    if (!isRecord(finding)) continue;
    const direction = getString(finding.direction_vs_peers).toLowerCase();
    const assessment = getString(finding.assessment).toLowerCase();
    const riskish = includesAny(assessment, ["higher_than_typical", "strongly", "danger", "anomal", "unusual"]);
    if (direction === "higher") {
      higher += 1;
      if (riskish) higherRisk += 1;
    } else if (direction === "lower") {
      lower += 1;
    } else {
      neutral += 1;
    }
  }

  if (higherRisk > 0) {
    return { label: "Higher than peers", tone: "warn", limited };
  }
  if (higher > 0 && lower > 0) {
    return { label: "Mixed vs peers", tone: "neutral", limited };
  }
  if (higher > 0) {
    return { label: "Higher than peers", tone: "warn", limited };
  }
  if (lower > 0 || neutral > 0) {
    return { label: "Within peer norms", tone: "good", limited };
  }
  return null;
};

const getFindingTone = (finding: ReportObject): Tone => {
  const assessment = getString(finding.assessment).toLowerCase();
  const direction = getString(finding.direction_vs_peers).toLowerCase();

  if (includesAny(assessment, ["higher_than_typical", "strongly", "danger", "anomal"])) {
    return "danger";
  }
  if (includesAny(assessment, ["slightly", "somewhat", "unusual", "higher"])) {
    return "warn";
  }
  if (includesAny(assessment, ["within", "typical", "none"]) || direction === "lower") {
    return "good";
  }
  if (direction === "higher") return "warn";
  return "neutral";
};

const renderValue = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <p className="llm-section__text">{String(value)}</p>;
  }
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return (
        <ul className="llm-section__list">
          {value.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <div className="llm-section__kv">
        {value.map((item, index) => (
          <div key={index} className="llm-kv-row">
            {isRecord(item) ? (
              Object.entries(item).map(([key, entry]) => (
                <div key={key} className="llm-kv">
                  <span className="llm-kv__key">{key}</span>
                  <span className="llm-kv__value">{String(entry)}</span>
                </div>
              ))
            ) : (
              <span className="llm-kv__value">{String(item)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (isRecord(value)) {
    return (
      <div className="llm-section__kv">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key} className="llm-kv">
            <span className="llm-kv__key">{key}</span>
            <span className="llm-kv__value">{String(entry)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const LLMSummaryModal = ({
  isOpen,
  onClose,
  personName,
  monthKey,
  iforestScore,
  isAnomaly,
  llmResponseJsonString,
  onOpenEvidence,
}: LLMSummaryModalProps) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const parsed = useMemo(() => {
    if (!isOpen) return { data: null as ReportObject | null, error: null as string | null };
    if (!llmResponseJsonString) return { data: null, error: null };
    const source = llmResponseJsonString;
    const result = parseJsonSafely<ReportObject>(source);
    if (!result.ok) return { data: null, error: "Report unavailable or invalid JSON." };
    return { data: result.value, error: null };
  }, [isOpen, llmResponseJsonString]);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const status = getAnomalyStatus(isAnomaly);
  const data = parsed.data ?? {};
  const detectionStatus = getDetectionStatus(isAnomaly);
  const peerContext = getPeerContextLabel(data);
  const meta = isRecord(data.meta) ? data.meta : null;
  const period = meta && isRecord(meta.period) ? meta.period : null;
  const neighbor = meta && isRecord(meta.neighbor_baseline) ? meta.neighbor_baseline : null;
  const statusMeta = meta && isRecord(meta.status) ? meta.status : null;
  const executiveSummary = Array.isArray(data.executive_summary) ? data.executive_summary : null;
  const timeWindow = isRecord(data.time_window) ? data.time_window : null;
  const keyFindings = Array.isArray(data.key_findings) ? data.key_findings : null;
  const typicalSignals = Array.isArray(data.typical_signals) ? data.typical_signals : null;
  const dataNotes = Array.isArray(data.data_notes) ? data.data_notes : null;
  const rawSupporting = isRecord(data.raw_supporting_values) ? data.raw_supporting_values : null;

  return createPortal(
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal llm-modal llmSummaryModal"
        role="dialog"
        aria-modal="true"
        ref={modalRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <div className="modal__title">Summary Report</div>
            <div className="modal__meta">
              <span className="modal__metaItem">
                {String(meta?.cardholder_name ?? personName)}
              </span>
              <span className="modal__metaItem">
                {String(period?.label ?? monthKey)}
              </span>
              <span className="modal__metaItem">
                <span className={`llmPrimaryBadge llmPrimaryBadge--${detectionStatus.tone}`}>
                  {detectionStatus.label}
                </span>
              </span>
              {peerContext && (
                <span className="modal__metaItem">
                  <span className={`llmPeerBadge llmPeerBadge--${peerContext.tone}`}>
                    Peer context: {peerContext.label}
                    {peerContext.limited ? " (limited baseline)" : ""}
                  </span>
                </span>
              )}
              <span className="modal__metaItem">iForest {formatScore(iforestScore, 3)}</span>
              {neighbor?.k !== undefined && (
                <span className="modal__metaItem">Peers: k={String(neighbor.k)}</span>
              )}
            </div>
            {statusMeta && getString(statusMeta.reason_short) && (
              <div className="llm-status-reason">{getString(statusMeta.reason_short)}</div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close summary"
          >
            Close
          </button>
        </div>

        <div className="modal__body llm-modal__body">
          {!llmResponseJsonString && (
            <EmptyState title="No report generated" description="No summary available for this month." />
          )}
          {llmResponseJsonString && parsed.error && (
            <EmptyState title="Report unavailable" description={parsed.error} />
          )}
          {llmResponseJsonString && !parsed.error && (
            <div className="llm-report">
              {executiveSummary && (
                <section className="llm-section">
                  <div className="llm-section__title">Executive Summary</div>
                  {renderValue(executiveSummary)}
                </section>
              )}
              {timeWindow && (
                <section className="llm-section">
                  <div className="llm-section__title">Time Window</div>
                  <div className="llm-section__text">
                    First event {formatDate(getString(timeWindow.first_event_time))}{" "}
                    {formatTime(getString(timeWindow.first_event_time))}
                  </div>
                  <div className="llm-section__text">
                    Last event {formatDate(getString(timeWindow.last_event_time))}{" "}
                    {formatTime(getString(timeWindow.last_event_time))}
                  </div>
                  {getBool(timeWindow.is_partial_month_likely) && (
                    <div className="llm-badge">Partial month likely</div>
                  )}
                  {getString(timeWindow.note) && (
                    <div className="llm-section__text">{getString(timeWindow.note)}</div>
                  )}
                </section>
              )}
              {keyFindings && (
                <section className="llm-section">
                  <div className="llm-section__title">Key Findings</div>
                  <div className="llm-findings">
                    {keyFindings.map((finding, index) => (
                      <div key={index} className="llm-finding">
                        <div className="llm-finding__header">
                          <div className="llm-finding__title">
                            {String((finding as ReportObject).metric_label ?? "Metric")}
                          </div>
                          {(finding as ReportObject).assessment !== undefined &&
                            (finding as ReportObject).assessment !== null && (
                            <div
                              className={`llmFindingBadge llmFindingBadge--${getFindingTone(
                                finding as ReportObject,
                              )}`}
                            >
                              {String((finding as ReportObject).assessment)}
                            </div>
                          )}
                        </div>
                        {(finding as ReportObject).why_it_matters !== undefined &&
                          (finding as ReportObject).why_it_matters !== null && (
                          <div className="llm-finding__takeaway">
                            {String((finding as ReportObject).why_it_matters)}
                          </div>
                        )}
                        {(finding as ReportObject).delta_vs_peers !== undefined && (
                          <div className="llm-finding__meta">
                            Compared to peers:{" "}
                            {String((finding as ReportObject).direction_vs_peers ?? "")}
                          </div>
                        )}
                        <div className="llm-finding__metaRow">
                          <div>
                            <span>User</span>
                            <span>{String((finding as ReportObject).user_value ?? "")}</span>
                          </div>
                          <div>
                            <span>Peers</span>
                            <span>{String((finding as ReportObject).peer_avg_value ?? "")}</span>
                          </div>
                          {isRecord((finding as ReportObject).typical_range) && (
                            <div>
                              <span>Typical</span>
                              <span>
                                {String(((finding as ReportObject).typical_range as ReportObject).p25 ?? "")}
                                –
                                {String(((finding as ReportObject).typical_range as ReportObject).p75 ?? "")}
                              </span>
                            </div>
                          )}
                        </div>
                        {(finding as ReportObject).caveat !== undefined &&
                          (finding as ReportObject).caveat !== null && (
                          <div className="llm-finding__caveat">
                            {String((finding as ReportObject).caveat)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {typicalSignals && (
                <section className="llm-section">
                  <div className="llm-section__title">Typical Signals</div>
                  {renderValue(
                    typicalSignals.map((item) => String((item as ReportObject).summary ?? "")),
                  )}
                </section>
              )}
              {dataNotes && (
                <section className="llm-section">
                  <div className="llm-section__title">Data Notes</div>
                  {renderValue(dataNotes.map((item) => String((item as ReportObject).message ?? "")))}
                </section>
              )}
              {rawSupporting && (
                <details className="llm-raw">
                  <summary>Raw supporting values</summary>
                  <pre>{JSON.stringify(rawSupporting, null, 2)}</pre>
                </details>
              )}
              <div className="llm-actions">
                <button type="button" className="btn btn--primary" onClick={onOpenEvidence}>
                  Open Evidence Explorer
                </button>
                <details className="llm-raw">
                  <summary>View raw JSON</summary>
                  <pre>{llmResponseJsonString}</pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
