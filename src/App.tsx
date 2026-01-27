import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { DenialBreakdownModal } from "./components/ui/DenialBreakdownModal";
import { baseTable, explanationTable } from "./data/mock";
import { joinRows, listMonthKeys, toMonthKey } from "./data/join";
import type { PersonId } from "./data/types";
import type { View } from "./types/navigation";

export const App = () => {
  const [activeView, setActiveView] = useState<View>("home");
  const joinedRows = useMemo(() => joinRows(baseTable, explanationTable), []);
  const monthOptions = useMemo(() => listMonthKeys(baseTable), []);
  const [activeMonthKey, setActiveMonthKey] = useState<string>(() => monthOptions[0]);
  const monthRows = useMemo(
    () => joinedRows.filter((row) => toMonthKey(row.year, row.month) === activeMonthKey),
    [joinedRows, activeMonthKey],
  );
  const [activePersonId, setActivePersonId] = useState<PersonId | null>(
    monthRows[0]?.cardholder_name ?? null,
  );
  const [denialModal, setDenialModal] = useState<{
    isOpen: boolean;
    personId: PersonId | null;
    monthKey: string | null;
  }>({
    isOpen: false,
    personId: null,
    monthKey: null,
  });

  const onSelectPerson = (personId: PersonId) => {
    setActivePersonId(personId);
  };

  const onNavigate = (view: View) => {
    setActiveView(view);
  };

  const openDenialModal = (personId: PersonId, monthKey: string) => {
    setDenialModal({
      isOpen: true,
      personId,
      monthKey,
    });
  };

  const closeDenialModal = () => {
    setDenialModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AppShell
      topBar={
        <TopBar
          activeView={activeView}
          onNavigate={onNavigate}
          people={monthRows.map((person) => ({
            id: person.cardholder_name,
            name: person.cardholder_name,
          }))}
          selectedPersonId={activePersonId ?? ""}
          onSelectPerson={(personId) => {
            setActivePersonId(personId);
            setActiveView("profile");
          }}
          monthKey={activeMonthKey}
          monthOptions={monthOptions}
          onMonthChange={(monthKey) => {
            setActiveMonthKey(monthKey);
            setActiveView("home");
          }}
        />
      }
    >
      {activeView === "home" && (
        <HomeScreen
          rows={monthRows}
          activeMonthKey={activeMonthKey}
          monthOptions={monthOptions}
          onMonthChange={setActiveMonthKey}
          onSelectPerson={onSelectPerson}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "profile" && (
        <ProfileScreen
          rows={joinedRows}
          personId={activePersonId}
          monthKey={activeMonthKey}
          onOpenDenialModal={openDenialModal}
        />
      )}
      {denialModal.isOpen && (
        <DenialBreakdownModal
          isOpen={denialModal.isOpen}
          personId={denialModal.personId}
          monthKey={denialModal.monthKey}
          rows={joinedRows}
          onClose={closeDenialModal}
        />
      )}
    </AppShell>
  );
};
