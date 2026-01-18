import type { PersonOption } from "../ui/PersonSelect";
import { PersonSelect } from "../ui/PersonSelect";
import type { View } from "../../types/navigation";

type TopBarProps = {
  activeView: View;
  onNavigate: (view: View) => void;
  people: PersonOption[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
};

export const TopBar = ({
  activeView,
  onNavigate,
  people,
  selectedPersonId,
  onSelectPerson,
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
          className={`nav-button ${activeView === "home" ? "nav-button--active" : ""}`.trim()}
          onClick={() => onNavigate("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={`nav-button ${activeView === "profile" ? "nav-button--active" : ""}`.trim()}
          onClick={() => onNavigate("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          className={`nav-button ${activeView === "denial" ? "nav-button--active" : ""}`.trim()}
          onClick={() => onNavigate("denial")}
        >
          Denial Breakdown
        </button>
      </nav>
      <div className="topbar__actions">
        <PersonSelect value={selectedPersonId} options={people} onChange={onSelectPerson} />
      </div>
    </header>
  );
};
