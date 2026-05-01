import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react/pure";
import { setupWorker } from "msw/browser";
import { afterAll, afterEach, beforeAll } from "vitest";
import { handlers } from "./mocks/handlers";

const worker = setupWorker(...handlers);

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
  worker.stop();
});

afterEach(() => {
  cleanup();
  worker.resetHandlers();
});
