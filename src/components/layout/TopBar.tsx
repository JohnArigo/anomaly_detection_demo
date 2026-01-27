import { useEffect, useRef, useState } from "react";
import type { PersonOption } from "../ui/PersonSelect";
import type { View } from "../../types/navigation";
import { PersonCombobox } from "../PersonCombobox";
import { MonthPicker } from "../ui/MonthPicker";
import "./TopBarSearch.css";

type TopBarProps = {
  activeView: View;
  onNavigate: (view: View) => void;
  people: PersonOption[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  monthKey: string;
  monthOptions: string[];
  onMonthChange: (monthKey: string) => void;
};

export const TopBar = ({
  activeView,
  onNavigate,
  people,
  selectedPersonId,
  onSelectPerson,
  monthKey,
  monthOptions,
  onMonthChange,
}: TopBarProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const isProfile = activeView === "profile";
  const hasSelection = Boolean(selectedPersonId);
  const selectedLabel =
    people.find((person) => person.id === selectedPersonId)?.name ?? null;
  const rosterOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));

  useEffect(() => {
    if (!isSearchExpanded) return;
    const input = searchWrapRef.current?.querySelector("input");
    if (input instanceof HTMLInputElement) {
      window.requestAnimationFrame(() => input.focus());
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    if (!isSearchExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
        searchButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSearchExpanded]);

  const onToggleSearch = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      searchButtonRef.current?.focus();
      return;
    }
    setIsSearchExpanded(true);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__brand">
          <div className="topbar__title">Anomaly Ops</div>
          <div className="topbar__subtitle">Badge Intelligence</div>
        </div>
        {isProfile && (
          <div className="topbar__crumbs">
            <span className="crumb">Roster</span>
            <span className="crumb__divider">/</span>
            <span className="crumb crumb--active">Profile</span>
          </div>
        )}
      </div>

      <nav className="topbar__nav topbar__center" aria-label="Primary">
        <button
          type="button"
          className={`nav-tab ${
            activeView === "home" ? "nav-tab--active" : ""
          }`.trim()}
          onClick={() => onNavigate("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={`nav-tab ${
            activeView === "profile" ? "nav-tab--active" : ""
          }`.trim()}
          onClick={() => {
            if (hasSelection) onNavigate("profile");
          }}
          disabled={!hasSelection}
          aria-disabled={!hasSelection}
        >
          Profile
        </button>
        {!hasSelection && (
          <span className="nav-hint">Select a person to view Profile</span>
        )}
      </nav>

      <div className="topbar__actions topbar__right">
        <div className="topbar-search">
          <button
            ref={searchButtonRef}
            type="button"
            className="topbar-search__toggle"
            aria-label={isSearchExpanded ? "Close search" : "Open search"}
            onClick={onToggleSearch}
          >
            <svg
              className="topbar-search__icon"
              viewBox="0 0 20 20"
              role="img"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <line
                x1="13.5"
                y1="13.5"
                x2="18"
                y2="18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {isSearchExpanded && (
            <div className="topBarSearchBlock" ref={searchWrapRef}>
              <MonthPicker
                monthKey={monthKey}
                monthOptions={monthOptions}
                onChange={onMonthChange}
                ariaLabel="Select month"
              />
              <PersonCombobox
                options={rosterOptions}
                selectedValue={selectedPersonId || null}
                selectedLabel={selectedLabel}
                onSelect={(personId) => {
                  onSelectPerson(personId);
                  onNavigate("profile");
                  setIsSearchExpanded(false);
                }}
                isProfile={isProfile}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
