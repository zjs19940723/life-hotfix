import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageShell } from "./page-shell";
import { RiskBanner } from "./risk-banner";
import { ScoreChip } from "./score-chip";

test("page shell renders the core navigation and content", () => {
  render(
    <MemoryRouter>
      <PageShell>
        <p>Body content</p>
      </PageShell>
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Life Hotfix" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "今日执行" })).toBeInTheDocument();
  expect(screen.getByText("Body content")).toBeInTheDocument();
});

test("score chip renders the provided label and value", () => {
  render(<ScoreChip label="当前积分" value="18" />);

  expect(screen.getByText("当前积分")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});

test("risk banner renders the provided title and description", () => {
  render(<RiskBanner title="风险提醒" description="今天保持稳定节奏" />);

  expect(screen.getByText("风险提醒")).toBeInTheDocument();
  expect(screen.getByText("今天保持稳定节奏")).toBeInTheDocument();
});
