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

/** Returns whether a hex color (#rrggbb) is perceptually light. */
function isLightColor(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

export function FlavorTagSettings() {
  const { data: tags } = useFlavorTags();
  const create = useCreateFlavorTag();
  const update = useUpdateFlavorTag();
  const del = useDeleteFlavorTag();
  const [draft, setDraft] = useState<Draft>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
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
            onDelete={
              draft.mode === "edit"
                ? async () => {
                    await del.mutateAsync(draft.tag.id);
                    setDraft(null);
                  }
                : undefined
            }
            onCancel={() => setDraft(null)}
          />
        </div>
      )}

      {tags?.length === 0 ? (
        <p className="text-muted-foreground">
          フレーバータグが登録されていません
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags?.map((tag) => {
            const fg = isLightColor(tag.color) ? "#1a1a1a" : "#ffffff";
            const borderColor = `${fg}55`;
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => setDraft({ mode: "edit", tag })}
                  aria-label={`${tag.name} を編集`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: tag.color,
                    color: fg,
                    borderColor,
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: fg }}
                  />
                  {tag.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setDraft({ mode: "create" })}
      >
        + フレーバータグを追加
      </Button>
    </div>
  );
}

function FlavorTagForm({
  defaultValues,
  onSubmit,
  onDelete,
  onCancel,
}: {
  defaultValues: CreateFlavorTagInput;
  onSubmit: (input: CreateFlavorTagInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
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
      <div className="flex justify-between gap-2">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            削除
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </div>
    </form>
  );
}
