import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, test } from "vitest";
import { db } from "../../data/db";
import { useAppStore } from "../../state/use-app-store";
import { TodayPage } from "./today-page";

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

test("today page renders daily items with unit quantities and operation-only state", async () => {
  render(<TodayPage />);

  expect(screen.getByRole("heading", { name: "今日执行" })).toBeInTheDocument();
  expect(await screen.findByRole("table", { name: "今日每日项" })).toBeInTheDocument();
  expect(screen.queryByRole("table", { name: "今日奖励项" })).not.toBeInTheDocument();
  expect(screen.queryByText("今日状态")).not.toBeInTheDocument();
  expect(await screen.findByText("学习")).toBeInTheDocument();
  expect(screen.queryByText(/AI 学习/)).not.toBeInTheDocument();
  expect(screen.getByText("每 30 分钟")).toBeInTheDocument();
  expect(screen.getByText("冥想")).toBeInTheDocument();
  expect(screen.getByText("每 5 分钟")).toBeInTheDocument();
  expect(screen.getByText("游泳")).toBeInTheDocument();
  expect(screen.getByText("每 1 公里")).toBeInTheDocument();

  const studyInput = screen.getByLabelText("学习数量");
  fireEvent.change(studyInput, { target: { value: "2" } });
  expect(screen.getByText("+12")).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole("button", { name: "完成" })[0]);

  await waitFor(() => {
    expect(screen.getByText("已记录完成。")).toBeInTheDocument();
  });
  expect(screen.getAllByRole("button", { name: "已完成" })[0]).toBeInTheDocument();
  expect(screen.getByText("平板支撑").closest("tr")).toHaveTextContent("完成");

  fireEvent.click(screen.getAllByRole("button", { name: "未完成" })[0]);
  expect(screen.getAllByRole("button", { name: "未完成" })[0]).toBeInTheDocument();
});

test("today page renders deduction items with step and quantity controls", async () => {
  render(<TodayPage />);

  expect(await screen.findByRole("table", { name: "今日扣分项" })).toBeInTheDocument();
  expect(screen.queryByRole("table", { name: "今日递进惩罚项" })).not.toBeInTheDocument();
  expect(await screen.findByText("熬夜")).toBeInTheDocument();
  expect(screen.getByLabelText("熬夜数量")).toHaveValue(1);

  fireEvent.change(screen.getByLabelText("熬夜档位"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("熬夜数量"), {
    target: { value: "2" },
  });

  expect(screen.getByText("-12")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "扣分" })[0]);

  await waitFor(() => {
    expect(screen.getByText("已记录扣分。")).toBeInTheDocument();
  });
});
