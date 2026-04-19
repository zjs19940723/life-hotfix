import { Outlet } from "react-router-dom";
import { PageShell } from "../features/shared/page-shell";

export default function App() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}
