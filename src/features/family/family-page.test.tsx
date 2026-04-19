import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, test } from "vitest";
import { db } from "../../data/db";
import { useAppStore } from "../../state/use-app-store";
import { FamilyPage } from "./family-page";

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

test("family page renders the revised child task library as a dense table", async () => {
  render(<FamilyPage />);

  expect(screen.getByRole("heading", { name: "家庭内容" })).toBeInTheDocument();
  expect(await screen.findByRole("table", { name: "让她满意任务库" })).toBeInTheDocument();
  expect(screen.getByText("在家不耐烦，发脾气")).toBeInTheDocument();
  expect(screen.getByText("-4")).toBeInTheDocument();
  expect(screen.queryByText("保持耐心沟通")).not.toBeInTheDocument();
  expect(screen.getByText("教作业")).toBeInTheDocument();
  expect(screen.queryByText("教识字，算数")).not.toBeInTheDocument();
  expect(screen.getByText("孩子接送")).toBeInTheDocument();
  expect(screen.getByText("睡前陪伴")).toBeInTheDocument();
  expect(screen.getByText("主动电动车入库，没电的时候充电")).toBeInTheDocument();
  expect(screen.queryByText(/周淑涵/)).not.toBeInTheDocument();
  expect(screen.queryByText(/对她做的事情保持感恩/)).not.toBeInTheDocument();
  expect(screen.queryByText(/尿盆/)).not.toBeInTheDocument();
  expect(screen.queryByText(/周四画画/)).not.toBeInTheDocument();
  expect(screen.queryByText(/周五跳舞/)).not.toBeInTheDocument();
  expect(screen.queryByText(/周六画画/)).not.toBeInTheDocument();
  expect(screen.queryByText(/盆子按序排列/)).not.toBeInTheDocument();
});

test("family impatience item records a once-per-day penalty with a visible button state", async () => {
  render(<FamilyPage />);

  await screen.findByText("在家不耐烦，发脾气");
  fireEvent.click(screen.getByRole("button", { name: "扣分" }));

  await waitFor(() => {
    expect(screen.getByText("已记录家庭情绪扣分。")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "已扣分" })).toBeDisabled();
});
