import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, test } from "vitest";
import { db } from "../../data/db";
import { useAppStore } from "../../state/use-app-store";
import { RulesPage } from "./rules-page";

beforeEach(async () => {
  await db.delete();
  await db.open();
  useAppStore.setState({
    rules: [],
    events: [],
    dayScore: 0,
    totalScore: 0,
    riskStatus: "danger",
  });
});

test("rules page renders preset categories, stepped rules, and edit actions", async () => {
  render(<RulesPage />);

  expect(screen.getByRole("heading", { name: "规则中心" })).toBeInTheDocument();
  expect(await screen.findByRole("table", { name: "必做项规则表" })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "必做项" })).toBeInTheDocument();
  expect(await screen.findByText("学习 30 分钟")).toBeInTheDocument();
  expect(screen.queryByText(/AI 学习/)).not.toBeInTheDocument();
  expect(screen.getByText("熬夜")).toBeInTheDocument();
  expect(screen.getByText(/22:30-22:59 -2/)).toBeInTheDocument();
  expect(screen.getByText("游戏 1 小时")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "修改" }).length).toBeGreaterThan(1);
});

test("rules page edits an existing flat rule", async () => {
  render(<RulesPage />);

  await screen.findByText("学习 30 分钟");
  fireEvent.click(screen.getAllByRole("button", { name: "修改" })[0]);
  fireEvent.change(screen.getByLabelText("规则名称"), {
    target: { value: "学习 45 分钟" },
  });
  fireEvent.change(screen.getByLabelText("分值"), {
    target: { value: "8" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

  await waitFor(() => {
    expect(screen.getByText("学习 45 分钟")).toBeInTheDocument();
  });
  expect(screen.getByText("+8")).toBeInTheDocument();
});
