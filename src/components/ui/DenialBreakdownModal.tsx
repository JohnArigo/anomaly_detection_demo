import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { BaseEvent, JoinedRow } from "../../data/types";
import { formatNumber, formatRate } from "../../utils/format";
import { Panel } from "./Panel";
import { EmptyState } from "./EmptyState";

type DenialBreakdownModalProps = {
  isOpen: boolean;
  personId: string | null;
  monthKey: string | null;
  rows: JoinedRow[];
  onClose: () => void;
};

const safeParse = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const DenialBreakdownModal = ({
  isOpen,
  personId,
  monthKey,
  rows,
  onClose,
}: DenialBreakdownModalProps) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const row = useMemo(
    () =>
      rows.find(
        (item) =>
          item.cardholder_name === personId &&
          `${item.year}-${String(item.month).padStart(2, "0")}` === monthKey,
      ) ?? null,
    [rows, personId, monthKey],
  );

  const deniedEvents = useMemo(() => {
    if (!isOpen || !row) return [];
    const events = safeParse<BaseEvent[]>(row.all_events) ?? [];
    return events.filter((event) => event.outcome.toLowerCase().includes("denied"));
  }, [isOpen, row]);

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

  const totalDenied = Number(row?.Denied_count ?? deniedEvents.length ?? 0);

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
          const focusable = Array.from(
            modalRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => !el.hasAttribute("disabled"));
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
            {row && (
              <div className="modal__meta">
                <span className="modal__metaItem">
                  Month: {monthKey}
                </span>
                <span className="modal__metaItem">
                  Total Denied Attempts: {formatNumber(totalDenied)}
                </span>
                <span className="modal__metaItem">
                  Denial Rate: {formatRate(row.denial_rate, 1)}
                </span>
              </div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close denial breakdown"
          >
            Close
          </button>
        </div>

        <div className="modal__body">
          <Panel title="Most Recent Denied Events">
            {deniedEvents.length === 0 ? (
              <EmptyState title="No denied events" />
            ) : (
              <div className="modal-table">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Event Type</th>
                      <th>Device</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deniedEvents.slice(0, 20).map((event, index) => (
                      <tr key={`${event.timestamp}-${index}`}>
                        <td>{event.timestamp}</td>
                        <td>{event.event_type}</td>
                        <td>{event.device}</td>
                        <td>{event.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>,
    document.body,
  );
};
