import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { DenialBreakdownModal } from "./components/ui/DenialBreakdownModal";
import { badgeEvents, baseNow, peopleBase } from "./data/mock";
import { buildMonthlySummaries, listMonthKeys, toMonthKey } from "./data/monthly";
import type { View } from "./types/navigation";
import type { PersonId } from "./data/types";

const getNewestMonthKey = () => {
  const keys = listMonthKeys(badgeEvents);
  return keys[0] ?? toMonthKey(baseNow.toISOString());
};

export const App = () => {
  const [activeView, setActiveView] = useState<View>("home");
  const [activePersonId, setActivePersonId] = useState<PersonId | null>(
    peopleBase[0]?.id ?? null,
  );
  const [activeMonthKey, setActiveMonthKey] = useState<string>(() => getNewestMonthKey());
  const [denialModal, setDenialModal] = useState<{
    isOpen: boolean;
    personId: PersonId | null;
    monthKey: string | null;
    highlightedEventId?: string | null;
  }>({
    isOpen: false,
    personId: null,
    monthKey: null,
    highlightedEventId: null,
  });
  const monthRoster = useMemo(
    () => buildMonthlySummaries(peopleBase, badgeEvents, activeMonthKey),
    [activeMonthKey],
  );

  const onSelectPerson = (personId: PersonId) => {
    setActivePersonId(personId);
  };

  const onNavigate = (view: View) => {
    setActiveView(view);
  };

  const openDenialModal = (
    personId: PersonId,
    monthKey: string,
    highlightedEventId?: string | null,
  ) => {
    setDenialModal({
      isOpen: true,
      personId,
      monthKey,
      highlightedEventId: highlightedEventId ?? null,
    });
  };

  const closeDenialModal = () => {
    setDenialModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return (
    <AppShell
      topBar={
        <TopBar
          activeView={activeView}
          onNavigate={onNavigate}
          people={monthRoster.map((person) => ({ id: person.personId, name: person.name }))}
          selectedPersonId={activePersonId ?? ""}
          onSelectPerson={(personId) => {
            setActivePersonId(personId);
            setActiveView("profile");
          }}
          monthKey={activeMonthKey}
          monthOptions={listMonthKeys(badgeEvents)}
          onMonthChange={setActiveMonthKey}
          onBack={() => setActiveView("home")}
        />
      }
    >
      {activeView === "home" && (
        <HomeScreen
          onSelectPerson={onSelectPerson}
          onNavigate={onNavigate}
          activeMonthKey={activeMonthKey}
          onMonthChange={setActiveMonthKey}
        />
      )}
      {activeView === "profile" && (
        <ProfileScreen
          personId={activePersonId}
          monthKey={activeMonthKey}
          denialModalOpen={denialModal.isOpen}
          onOpenDenialModal={openDenialModal}
        />
      )}
      {denialModal.isOpen && (
        <DenialBreakdownModal
          isOpen={denialModal.isOpen}
          personId={denialModal.personId}
          monthKey={denialModal.monthKey}
          highlightedEventId={denialModal.highlightedEventId}
          onClose={closeDenialModal}
        />
      )}
    </AppShell>
  );
};
