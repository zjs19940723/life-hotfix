import { render, screen } from "@testing-library/react";
import { HomePage } from "./home-page";

test("home page renders its heading and summary", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", { name: "今日总览" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "这里展示日积分、总积分、风险等级和今天最不能失守的任务。",
    ),
  ).toBeInTheDocument();
});
