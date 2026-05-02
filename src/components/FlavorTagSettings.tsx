import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateFlavorTag,
  useDeleteFlavorTag,
  useFlavorTags,
  useUpdateFlavorTag,
} from "@/hooks/useFlavorTags";
import {
  type CreateFlavorTagInput,
  CreateFlavorTagInputSchema,
  type FlavorTag,
} from "@/schemas/masterData";

type Draft = { mode: "create" } | { mode: "edit"; tag: FlavorTag } | null;

const empty: CreateFlavorTagInput = { name: "", color: "#F9A8D4" };

export function FlavorTagSettings() {
  const { data: tags } = useFlavorTags();
  const create = useCreateFlavorTag();
  const update = useUpdateFlavorTag();
  const del = useDeleteFlavorTag();
  const [draft, setDraft] = useState<Draft>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">フレーバータグ</h2>
        <Button onClick={() => setDraft({ mode: "create" })}>
          フレーバータグを追加
        </Button>
      </div>

      {draft && (
        <div
          role="dialog"
          aria-labelledby="flavor-tag-dialog-title"
          className="rounded-lg border bg-muted/30 p-4"
        >
          <h3 id="flavor-tag-dialog-title" className="mb-3 font-medium">
            {draft.mode === "edit"
              ? "フレーバータグを編集"
              : "フレーバータグを追加"}
          </h3>
          <FlavorTagForm
            key={draft.mode === "edit" ? draft.tag.id : "new"}
            defaultValues={draft.mode === "edit" ? draft.tag : empty}
            onSubmit={async (input) => {
              if (draft.mode === "edit") {
                await update.mutateAsync({ ...draft.tag, ...input });
              } else {
                await create.mutateAsync(input);
              }
              setDraft(null);
            }}
            onCancel={() => setDraft(null)}
          />
        </div>
      )}

      {tags?.length === 0 ? (
        <p className="text-muted-foreground">
          フレーバータグが登録されていません
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tags?.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-full"
                style={{ background: tag.color }}
              />
              <span className="flex-1">{tag.name}</span>
              <Button
                variant="outline"
                onClick={() => setDraft({ mode: "edit", tag })}
              >
                編集
              </Button>
              <Button variant="destructive" onClick={() => del.mutate(tag.id)}>
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FlavorTagForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues: CreateFlavorTagInput;
  onSubmit: (input: CreateFlavorTagInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: CreateFlavorTagInputSchema },
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
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="flavor-tag-name">名前</Label>
            <Input
              id="flavor-tag-name"
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
            <Label htmlFor="flavor-tag-color">カラー (#hex)</Label>
            <Input
              id="flavor-tag-color"
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
