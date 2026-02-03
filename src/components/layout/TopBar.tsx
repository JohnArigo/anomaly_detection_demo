import type { PersonOption } from "../ui/PersonSelect";
import type { View } from "../../types/navigation";

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
  selectedPersonId,
}: TopBarProps) => {
  const hasSelection = Boolean(selectedPersonId);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__brand">
          <div className="topbar__title">Anomaly Ops</div>
          <div className="topbar__subtitle">Badge Intelligence</div>
        </div>
        <nav className="topbar__nav" aria-label="Primary">
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
      </div>

      <div className="topbar__actions topbar__right" />
    </header>
  );
};
