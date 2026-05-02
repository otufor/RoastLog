import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateRoastLevel,
  useDeleteRoastLevel,
  useRoastLevels,
  useUpdateRoastLevel,
} from "@/hooks/useRoastLevels";
import {
  type CreateRoastLevelInput,
  CreateRoastLevelInputSchema,
  type RoastLevel,
} from "@/schemas/masterData";

type Draft = { mode: "create" } | { mode: "edit"; level: RoastLevel } | null;

const empty: CreateRoastLevelInput = { label: "", color: "#B06B1E", order: 0 };

export function RoastLevelSettings() {
  const { data: levels } = useRoastLevels();
  const create = useCreateRoastLevel();
  const update = useUpdateRoastLevel();
  const del = useDeleteRoastLevel();
  const [draft, setDraft] = useState<Draft>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">焙煎度</h2>
        <Button onClick={() => setDraft({ mode: "create" })}>
          焙煎度を追加
        </Button>
      </div>

      {draft && (
        <div
          role="dialog"
          aria-labelledby="roast-level-dialog-title"
          className="rounded-lg border bg-muted/30 p-4"
        >
          <h3 id="roast-level-dialog-title" className="mb-3 font-medium">
            {draft.mode === "edit" ? "焙煎度を編集" : "焙煎度を追加"}
          </h3>
          <RoastLevelForm
            key={draft.mode === "edit" ? draft.level.id : "new"}
            defaultValues={draft.mode === "edit" ? draft.level : empty}
            onSubmit={async (input) => {
              if (draft.mode === "edit") {
                await update.mutateAsync({ ...draft.level, ...input });
              } else {
                await create.mutateAsync(input);
              }
              setDraft(null);
            }}
            onCancel={() => setDraft(null)}
          />
        </div>
      )}

      {levels?.length === 0 ? (
        <p className="text-muted-foreground">焙煎度が登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {levels?.map((level) => (
            <li
              key={level.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-full"
                style={{ background: level.color }}
              />
              <span className="flex-1">{level.label}</span>
              <span className="text-sm text-muted-foreground">
                順: {level.order}
              </span>
              <Button
                variant="outline"
                onClick={() => setDraft({ mode: "edit", level })}
              >
                編集
              </Button>
              <Button
                variant="destructive"
                onClick={() => del.mutate(level.id)}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RoastLevelForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues: CreateRoastLevelInput;
  onSubmit: (input: CreateRoastLevelInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: CreateRoastLevelInputSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="label">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="roast-level-label">ラベル</Label>
            <Input
              id="roast-level-label"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="color">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="roast-level-color">カラー (#hex)</Label>
            <Input
              id="roast-level-color"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="order">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="roast-level-order">並び順</Label>
            <Input
              id="roast-level-order"
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
