import { useEffect, useId, useRef } from "react";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  restoreFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

const getFocusable = (root: HTMLElement | null) => {
  if (!root) return [] as HTMLElement[];
  const selectors = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];
  return Array.from(root.querySelectorAll<HTMLElement>(selectors.join(","))).filter(
    (el) => !el.hasAttribute("disabled"),
  );
};

export const FilterDrawer = ({
  isOpen,
  onClose,
  title = "Filters",
  children,
  restoreFocusRef,
}: FilterDrawerProps) => {
  const dialogId = useId();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusables = getFocusable(drawerRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => closeRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    if (restoreFocusRef?.current) restoreFocusRef.current.focus();
  }, [isOpen, restoreFocusRef]);

  return (
    <div className={`filter-drawer ${isOpen ? "filter-drawer--open" : ""}`.trim()}>
      <button
        type="button"
        className="filter-drawer__scrim"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="filter-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        id={dialogId}
      >
        <div className="filter-drawer__header">
          <div className="filter-drawer__title">{title}</div>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--ghost btn--small"
            onClick={onClose}
            aria-label="Close filters"
          >
            Close
          </button>
        </div>
        <div className="filter-drawer__body">{children}</div>
      </div>
    </div>
  );
};
