import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/scrollbars.css";
import "./styles/global.css";
import "./styles/topbar.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/panels.css";
import "./styles/chips.css";
import "./styles/table.css";
import "./components/roster/RosterCards.css";
import "./styles/home.css";
import "./styles/profile.css";
import "./styles/drivers.css";
import "./styles/evidence.css";
import "./styles/modal.css";
import "./styles/tooltip.css";
import "./components/filters/filterDrawer.css";
import "./components/profile/LLMSummaryModal.css";
import "./components/profile/ProfileHeaderActions.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
