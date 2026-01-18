import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { DenialBreakdownScreen } from "./screens/DenialBreakdownScreen";
import { peopleBase } from "./data/mock";
import type { View } from "./types/navigation";
import type { PersonId } from "./data/types";

export const App = () => {
  const [activeView, setActiveView] = useState<View>("home");
  const [activePersonId, setActivePersonId] = useState<PersonId | null>(
    peopleBase[0]?.id ?? null,
  );
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  const onSelectPerson = (personId: PersonId) => {
    setActivePersonId(personId);
  };

  const onNavigate = (view: View) => {
    setActiveView(view);
  };

  const onHighlightEvent = (eventId: string | null) => {
    setHighlightedEventId(eventId);
  };

  return (
    <AppShell
      topBar={
        <TopBar
          activeView={activeView}
          onNavigate={onNavigate}
          people={peopleBase.map((person) => ({ id: person.id, name: person.name }))}
          selectedPersonId={activePersonId ?? ""}
          onSelectPerson={onSelectPerson}
        />
      }
    >
      {activeView === "home" && (
        <HomeScreen onSelectPerson={onSelectPerson} onNavigate={onNavigate} />
      )}
      {activeView === "profile" && (
        <ProfileScreen
          personId={activePersonId}
          onNavigate={onNavigate}
          onHighlightEvent={onHighlightEvent}
        />
      )}
      {activeView === "denial" && (
        <DenialBreakdownScreen
          personId={activePersonId}
          highlightedEventId={highlightedEventId}
        />
      )}
    </AppShell>
  );
};
