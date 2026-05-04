import { render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimePicker } from "@/components/TimePicker";

describe("TimePicker", () => {
  it("ラベルを表示する", () => {
    render(<TimePicker label="焙煎時間" value={0} onChange={vi.fn()} />);
    expect(screen.getByText("焙煎時間")).toBeInTheDocument();
  });

  it("value=300 のとき '05:00' と表示する", () => {
    render(<TimePicker label="焙煎時間" value={300} onChange={vi.fn()} />);
    expect(screen.getByText("05:00")).toBeInTheDocument();
  });

  it("value=185 のとき '03:05' と表示する", () => {
    render(<TimePicker label="焙煎時間" value={185} onChange={vi.fn()} />);
    expect(screen.getByText("03:05")).toBeInTheDocument();
  });

  it("nullable=true かつ value=null のとき「なし」トグルがオン", () => {
    render(
      <TimePicker label="1ハゼ" value={null} onChange={vi.fn()} nullable />,
    );
    const toggle = screen.getByRole("checkbox", { name: "なし" });
    expect(toggle).toBeChecked();
  });

  it("nullable=true で「なし」をクリックすると onChange(null) が呼ばれる", async () => {
    const onChange = vi.fn();
    render(
      <TimePicker label="1ハゼ" value={180} onChange={onChange} nullable />,
    );
    const toggle = screen.getByRole("checkbox", { name: "なし" });
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("nullable=true かつ value=null のとき「なし」を外すと onChange(0) が呼ばれる", async () => {
    const onChange = vi.fn();
    render(
      <TimePicker label="1ハゼ" value={null} onChange={onChange} nullable />,
    );
    const toggle = screen.getByRole("checkbox", { name: "なし" });
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
