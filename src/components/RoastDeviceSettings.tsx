import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateRoastDevice,
  useDeleteRoastDevice,
  useRoastDevices,
  useUpdateRoastDevice,
} from "@/hooks/useRoastDevices";
import {
  type CreateRoastDeviceInput,
  CreateRoastDeviceInputSchema,
  type RoastDevice,
} from "@/schemas/masterData";

type Draft = { mode: "create" } | { mode: "edit"; device: RoastDevice } | null;

const empty: CreateRoastDeviceInput = { name: "", method: "", note: "" };

function RoastDeviceIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path d="M7 8V5a2 2 0 012-2h6a2 2 0 012 2v3" />
      <path d="M12 11v5M9 13l3-2 3 2" />
    </svg>
  );
}

export function RoastDeviceSettings() {
  const { data: devices } = useRoastDevices();
  const create = useCreateRoastDevice();
  const update = useUpdateRoastDevice();
  const del = useDeleteRoastDevice();
  const [draft, setDraft] = useState<Draft>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
      {draft && (
        <div
          role="dialog"
          aria-labelledby="roast-device-dialog-title"
          className="rounded-lg border bg-muted/30 p-4"
        >
          <h3 id="roast-device-dialog-title" className="mb-3 font-medium">
            {draft.mode === "edit" ? "焙煎機を編集" : "焙煎機を追加"}
          </h3>
          <RoastDeviceForm
            key={draft.mode === "edit" ? draft.device.id : "new"}
            defaultValues={draft.mode === "edit" ? draft.device : empty}
            onSubmit={async (input) => {
              if (draft.mode === "edit") {
                await update.mutateAsync({ ...draft.device, ...input });
              } else {
                await create.mutateAsync(input);
              }
              setDraft(null);
            }}
            onCancel={() => setDraft(null)}
          />
        </div>
      )}

      {devices?.length === 0 ? (
        <p className="text-muted-foreground">焙煎機が登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {devices?.map((device) => (
            <li
              key={device.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-secondary-foreground">
                <RoastDeviceIcon />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{device.name}</span>
                {device.method && (
                  <span className="text-xs text-muted-foreground">
                    {device.method}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setDraft({ mode: "edit", device })}
                >
                  編集
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => del.mutate(device.id)}
                >
                  削除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setDraft({ mode: "create" })}
      >
        焙煎機を追加
      </Button>
    </div>
  );
}

function RoastDeviceForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues: CreateRoastDeviceInput;
  onSubmit: (input: CreateRoastDeviceInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: CreateRoastDeviceInputSchema },
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
            <Label htmlFor="roast-device-name">名前</Label>
            <Input
              id="roast-device-name"
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
      <form.Field name="method">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="roast-device-method">方式</Label>
            <Input
              id="roast-device-method"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="note">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="roast-device-note">メモ</Label>
            <Input
              id="roast-device-note"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
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
