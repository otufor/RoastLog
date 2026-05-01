import { useForm } from "@tanstack/react-form";
import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const TestSchema = z.object({ name: z.string().min(1, "必須項目です") });

function TestForm({ onSubmit }: { onSubmit: (v: { name: string }) => void }) {
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onSubmit: TestSchema },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <>
            <input
              aria-label="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) => (
              <span key={String(err)} role="alert">
                {String(err)}
              </span>
            ))}
          </>
        )}
      </form.Field>
      <button type="submit">送信</button>
    </form>
  );
}

describe("TanStack Form + Zod v4 (Standard Schema 自動検出)", () => {
  it("空のまま送信するとバリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("値を入力して送信すると onSubmit が呼ばれる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("name"), "エチオピア");
    await user.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "エチオピア" });
    });
  });
});
