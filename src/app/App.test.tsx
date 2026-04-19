import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders the main navigation", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "今日执行" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "兑换中心" })).toBeInTheDocument();
});

test("keeps the home nav inactive on child routes", () => {
  render(
    <MemoryRouter initialEntries={["/today"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "首页" })).not.toHaveClass("active");
  expect(screen.getByRole("link", { name: "今日执行" })).toHaveClass("active");
});
