import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, test } from "vitest";
import { db } from "../../data/db";
import { useAppStore } from "../../state/use-app-store";
import { ExchangePage } from "./exchange-page";

beforeEach(async () => {
  await db.delete();
  await db.open();
  useAppStore.setState({
    rules: [],
    events: [],
    dayScore: 0,
    totalScore: 100,
    riskStatus: "safe",
  });
});

test("exchange page renders adjustable redemption tools", async () => {
  render(<ExchangePage />);

  expect(screen.getByRole("heading", { name: "兑换中心" })).toBeInTheDocument();
  expect(await screen.findByRole("table", { name: "兑换工具表" })).toBeInTheDocument();
  expect(screen.getByText("游戏时间")).toBeInTheDocument();
  expect(screen.getByLabelText("游戏时间数量")).toHaveValue(1);
  expect(screen.getByText("每 30 分钟")).toBeInTheDocument();
  expect(screen.getByText("手游氪金额度")).toBeInTheDocument();
  expect(screen.getAllByText("每 50 元").length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText("油冲次数")).toBeInTheDocument();
  expect(screen.getByText("每 1 次")).toBeInTheDocument();
  expect(screen.getByText("手办额度")).toBeInTheDocument();
  expect(screen.getByText("购物额度")).toBeInTheDocument();
});

test("exchange page recalculates cost from the entered unit count", async () => {
  render(<ExchangePage />);

  const gameInput = await screen.findByLabelText("游戏时间数量");
  fireEvent.change(gameInput, { target: { value: "3" } });

  expect(screen.getByText("90 分钟")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});
