import { render, screen } from "@testing-library/react";
import { ScoreChip } from "./score-chip";

test("score chip renders label and value", () => {
  render(<ScoreChip label="当前积分" value="18" />);

  expect(screen.getByText("当前积分")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});
