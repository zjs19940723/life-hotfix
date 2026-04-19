import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProviders } from "./providers";
import { ExchangePage } from "../features/exchange/exchange-page";
import { FamilyPage } from "../features/family/family-page";
import { HomePage } from "../features/home/home-page";
import { LedgerPage } from "../features/ledger/ledger-page";
import { RulesPage } from "../features/rules/rules-page";
import { TodayPage } from "../features/today/today-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <App />
      </AppProviders>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "today", element: <TodayPage /> },
      { path: "family", element: <FamilyPage /> },
      { path: "exchange", element: <ExchangePage /> },
      { path: "ledger", element: <LedgerPage /> },
      { path: "rules", element: <RulesPage /> },
    ],
  },
]);
