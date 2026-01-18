import { useMemo, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { TopBar } from "./components/layout/TopBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { DenialBreakdownScreen } from "./screens/DenialBreakdownScreen";
import { people as peopleData } from "./data/mock";
import { percentileRank } from "./utils/math";

export const App = () => {
  const [view, setView] = useState<"home" | "profile" | "denials">("home");
  const [personId, setPersonId] = useState(peopleData[0]?.id ?? "");

  const selectedPerson = useMemo(() => {
    return peopleData.find((person) => person.id === personId) ?? peopleData[0];
  }, [personId]);

  const peopleOptions = useMemo(() => {
    return peopleData.map((person) => ({ id: person.id, name: person.name }));
  }, [peopleData]);

  const isoScores = useMemo(
    () => peopleData.map((person) => person.isolationForestScore),
    [peopleData],
  );
  const anomalyScores = useMemo(
    () => peopleData.map((person) => person.anomalyScore),
    [peopleData],
  );
  const avgDeniedPercent = useMemo(() => {
    if (peopleData.length === 0) return 0;
    const total = peopleData.reduce((sum, person) => sum + person.denialPercent, 0);
    return total / peopleData.length;
  }, [peopleData]);

  if (!selectedPerson) return null;

  const isoPercentile = percentileRank(isoScores, selectedPerson.isolationForestScore);
  const anomalyPercentile = percentileRank(anomalyScores, selectedPerson.anomalyScore);

  return (
    <AppShell
      topBar={
        <TopBar
          activeView={view}
          onViewChange={setView}
          people={peopleOptions}
          selectedPersonId={selectedPerson.id}
          onPersonChange={setPersonId}
        />
      }
    >
      {view === "home" && <HomeScreen people={peopleData} />}
      {view === "profile" && (
        <ProfileScreen
          person={selectedPerson}
          avgDeniedPercent={avgDeniedPercent}
          isoPercentile={isoPercentile}
          anomalyPercentile={anomalyPercentile}
        />
      )}
      {view === "denials" && <DenialBreakdownScreen person={selectedPerson} />}
    </AppShell>
  );
};
