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
import type { CreateRoastLevelInput, RoastLevel } from "@/schemas/masterData";

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
        <div role="dialog" className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 font-medium">
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
  const [label, setLabel] = useState(defaultValues.label);
  const [color, setColor] = useState(defaultValues.color);
  const [order, setOrder] = useState(defaultValues.order);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ label, color, order });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-level-label">ラベル</Label>
        <Input
          id="roast-level-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-level-color">カラー (#hex)</Label>
        <Input
          id="roast-level-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-level-order">並び順</Label>
        <Input
          id="roast-level-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
