import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "首页", end: true },
  { to: "/today", label: "今日执行" },
  { to: "/family", label: "家务" },
  { to: "/exchange", label: "兑换中心" },
  { to: "/ledger", label: "热修记录" },
  { to: "/rules", label: "规则中心" },
];

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>Life Hotfix</h1>
        </div>
        <nav className="app-nav" aria-label="主导航">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
