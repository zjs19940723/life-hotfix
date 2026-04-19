import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageShell } from "./page-shell";

test("page shell renders navigation without the old behavior-control eyebrow", () => {
  render(
    <MemoryRouter>
      <PageShell>
        <p>Body content</p>
      </PageShell>
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Life Hotfix" })).toBeInTheDocument();
  expect(screen.queryByText("个人行为风控系统")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "今日执行" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "家庭" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "兑换中心" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "账本" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "规则中心" })).toBeInTheDocument();
  expect(screen.getByText("Body content")).toBeInTheDocument();
});
