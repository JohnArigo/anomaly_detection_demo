import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { DenialBreakdownScreen } from "./screens/DenialBreakdownScreen";
import { badgeEvents, baseNow, peopleBase } from "./data/mock";
import { buildPersonRollup, buildProfiles } from "./data/rollups";
import { createDefaultFilters } from "./utils/range";
import type { View } from "./types/navigation";
import type { PersonId } from "./data/types";

export const App = () => {
  const [activeView, setActiveView] = useState<View>("home");
  const [activePersonId, setActivePersonId] = useState<PersonId | null>(
    peopleBase[0]?.id ?? null,
  );

  const filters = useMemo(() => createDefaultFilters(baseNow), []);
  const { profiles, summary } = useMemo(
    () => buildProfiles(peopleBase, badgeEvents, filters),
    [filters],
  );
  const rollups = useMemo(() => profiles.map(buildPersonRollup), [profiles]);

  const peopleOptions = useMemo(() => {
    return peopleBase.map((person) => ({ id: person.id, name: person.name }));
  }, []);

  const onSelectPerson = (personId: PersonId) => {
    setActivePersonId(personId);
  };

  const onNavigate = (view: View) => {
    setActiveView(view);
  };

  return (
    <AppShell
      topBar={
        <TopBar
          activeView={activeView}
          onNavigate={onNavigate}
          people={peopleOptions}
          selectedPersonId={activePersonId ?? ""}
          onSelectPerson={onSelectPerson}
        />
      }
    >
      {activeView === "home" && (
        <HomeScreen
          rollups={rollups}
          summary={summary}
          onSelectPerson={onSelectPerson}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "profile" && <ProfileScreen personId={activePersonId} />}
      {activeView === "denial" && <DenialBreakdownScreen personId={activePersonId} />}
    </AppShell>
  );
};
