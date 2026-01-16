import { type PersonOption, PersonSelect } from "../ui/PersonSelect";

type TopBarProps = {
  activeView: "profile" | "denials";
  onViewChange: (view: "profile" | "denials") => void;
  people: PersonOption[];
  selectedPersonId: string;
  onPersonChange: (id: string) => void;
};

export const TopBar = ({
  activeView,
  onViewChange,
  people,
  selectedPersonId,
  onPersonChange,
}: TopBarProps) => {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__title">Anomaly Ops</div>
        <div className="topbar__subtitle">Badge Intelligence</div>
      </div>
      <nav className="topbar__nav" aria-label="Primary">
        <button
          type="button"
          className={`nav-button ${
            activeView === "profile" ? "nav-button--active" : ""
          }`.trim()}
          onClick={() => onViewChange("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          className={`nav-button ${
            activeView === "denials" ? "nav-button--active" : ""
          }`.trim()}
          onClick={() => onViewChange("denials")}
        >
          Denial Breakdown
        </button>
      </nav>
      <div className="topbar__actions">
        <PersonSelect
          value={selectedPersonId}
          options={people}
          onChange={onPersonChange}
        />
      </div>
    </header>
  );
};
