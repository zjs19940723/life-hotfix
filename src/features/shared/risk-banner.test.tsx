import { render, screen } from "@testing-library/react";
import { RiskBanner } from "./risk-banner";

test("risk banner renders title and description", () => {
  render(<RiskBanner title="风险提醒" description="今天保持稳定节奏" />);

  expect(screen.getByText("风险提醒")).toBeInTheDocument();
  expect(screen.getByText("今天保持稳定节奏")).toBeInTheDocument();
});
