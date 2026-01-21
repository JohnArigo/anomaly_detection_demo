import { type ReactNode } from "react";
import "../../styles/tabs.css";

type Tab = {
  id: string;
  label: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export const Tabs = ({ tabs, activeId, onChange }: TabsProps) => {
  return (
    <div className="tabs" role="tablist" aria-label="Event filters">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          className={`tab ${activeId === tab.id ? "tab--active" : ""}`.trim()}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
