import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react/pure";

describe("browser smoke test", () => {
  it("実ブラウザで React をレンダリングできる", () => {
    render(<div role="status">RoastLog browser test</div>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("実ブラウザで IndexedDB が使える", () => {
    expect(typeof indexedDB).toBe("object");
  });

  it("crypto.randomUUID() が使える", () => {
    const id = crypto.randomUUID();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
