import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Clean up after every test
afterEach(() => {
  cleanup();
});
