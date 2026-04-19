import { render, screen } from "@testing-library/react";
import { LedgerPage } from "./ledger-page";

test("ledger page renders its heading and summary", () => {
  render(<LedgerPage />);

  expect(
    screen.getByRole("heading", {
      name: "积分账本 / 复盘",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "这里展示积分变动记录，方便你回看今天到底是哪些行为拉高或拉低了积分。",
    ),
  ).toBeInTheDocument();
});
