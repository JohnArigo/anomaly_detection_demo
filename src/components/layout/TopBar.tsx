import type { PersonOption } from "../ui/PersonSelect";
import type { View } from "../../types/navigation";
import { PersonCombobox } from "../PersonCombobox";
import { GlobalSearch } from "../GlobalSearch";

type TopBarProps = {
  activeView: View;
  onNavigate: (view: View) => void;
  people: PersonOption[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  monthKey: string;
  monthOptions: string[];
  onMonthChange: (monthKey: string) => void;
  onBack: () => void;
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
  onBack,
}: TopBarProps) => {
  const isProfile = activeView === "profile";
  const hasSelection = Boolean(selectedPersonId);
  const selectedLabel =
    people.find((person) => person.id === selectedPersonId)?.name ?? null;
  const rosterOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__brand">
          <div className="topbar__title">Anomaly Ops</div>
          <div className="topbar__subtitle">Badge Intelligence</div>
        </div>
        {isProfile && (
          <div className="topbar__crumbs">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={onBack}
              aria-label="Back to roster"
            >
              Back
            </button>
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
        <label className="select">
          <select
            value={monthKey}
            onChange={(event) => onMonthChange(event.target.value)}
          >
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <PersonCombobox
          options={rosterOptions}
          selectedValue={selectedPersonId || null}
          selectedLabel={selectedLabel}
          onSelect={(personId) => {
            onSelectPerson(personId);
            onNavigate("profile");
          }}
          isProfile={isProfile}
        />
      </div>
    </header>
  );
};
