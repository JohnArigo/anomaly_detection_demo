import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDate, formatTime } from "../../utils/date";
import { formatNumber, formatPercent } from "../../utils/format";
import { Panel } from "./Panel";
import { DonutChart } from "./DonutChart";
import { BadgePill } from "./BadgePill";
import { IconButton } from "./IconButton";
import { EmptyState } from "./EmptyState";
import { badgeEvents, peopleBase } from "../../data/mock";
import { getPersonById } from "../../data/selectors";

const reasonColors: Record<string, string> = {
  "Expired Badge": "var(--danger)",
  "Time Restricted": "var(--warn)",
  "Invalid Entry Code": "var(--accent)",
  "No Access": "var(--muted-strong)",
  Unknown: "var(--muted)",
};

type DenialBreakdownModalProps = {
  isOpen: boolean;
  personId: string | null;
  monthKey: string | null;
  highlightedEventId?: string | null;
  onClose: () => void;
};

const getFocusable = (root: HTMLElement) => {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );
  return elements.filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
};

export const DenialBreakdownModal = ({
  isOpen,
  personId,
  monthKey,
  highlightedEventId,
  onClose,
}: DenialBreakdownModalProps) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const person = useMemo(
    () => getPersonById(personId, peopleBase, badgeEvents),
    [personId],
  );

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

  const totalDenied = person?.deniedCount ?? 0;
  const donutData =
    person?.denialReasons.map((reason) => ({
      label: reason.reason,
      value: reason.count,
      color: reasonColors[reason.reason] ?? "var(--muted)",
    })) ?? [];

  return createPortal(
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || !modalRef.current) return;
          const focusable = getFocusable(modalRef.current);
          if (focusable.length === 0) {
            event.preventDefault();
            modalRef.current.focus();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement as HTMLElement | null;
          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="modal__header">
          <div>
            <div id={titleId} className="modal__title">
              Badge Denial Breakdown
            </div>
            <div className="modal__meta">
              {person && (
                <>
                  <span className="modal__metaItem">
                    Last Badge: {formatDate(person.lastBadgeTimestamp)}{" "}
                    {formatTime(person.lastBadgeTimestamp)}
                  </span>
                  <span className="modal__metaItem">
                    Total Denied Attempts: {formatNumber(totalDenied)}
                  </span>
                </>
              )}
              {monthKey && <span className="modal__metaItem">Month: {monthKey}</span>}
            </div>
          </div>
          <IconButton label="Close" icon="X" onClick={onClose} buttonRef={closeButtonRef} />
        </div>
        <div className="modal__body">
          {!person ? (
            <EmptyState title="Select a person" description="Choose a person to view denial details." />
          ) : (
            <>
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
                            className={
                              highlightedEventId === event.id ? "row--active" : undefined
                            }
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
