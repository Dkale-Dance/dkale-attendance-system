import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login or register heading", () => {
  render(<App />);
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});


