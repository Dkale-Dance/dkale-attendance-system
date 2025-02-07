import { render, screen } from "@testing-library/react";
import ErrorMessage from "../components/ErrorMessage";

// Suppress only the ReactDOMTestUtils.act warning
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((message) => {
    if (message.includes("ReactDOMTestUtils.act is deprecated")) {
      return; // Ignore this specific warning
    }
    console.warn(message); // Show all other warnings
  });
});

afterAll(() => {
  console.error.mockRestore(); // Restore console.error after tests
});

describe("ErrorMessage Component", () => {
  test("Renders the error message when provided", () => {
    render(<ErrorMessage message="Firebase: Error (auth/invalid-credential)." />);

    // Verify error is displayed
    const errorMessage = screen.getByText(/firebase: error/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test("Does not render anything when message is empty", () => {
    render(<ErrorMessage message="" />);

    // Expect no error message to be found in the document
    expect(screen.queryByText(/firebase/i)).not.toBeInTheDocument();
  });
});
