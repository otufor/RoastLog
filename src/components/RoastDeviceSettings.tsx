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
import type { CreateRoastDeviceInput, RoastDevice } from "@/schemas/masterData";

type Draft = { mode: "create" } | { mode: "edit"; device: RoastDevice } | null;

const empty: CreateRoastDeviceInput = { name: "", method: "", note: "" };

export function RoastDeviceSettings() {
  const { data: devices } = useRoastDevices();
  const create = useCreateRoastDevice();
  const update = useUpdateRoastDevice();
  const del = useDeleteRoastDevice();
  const [draft, setDraft] = useState<Draft>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">焙煎機</h2>
        <Button onClick={() => setDraft({ mode: "create" })}>
          焙煎機を追加
        </Button>
      </div>

      {draft && (
        <div role="dialog" className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 font-medium">
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
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 font-medium">{device.name}</span>
                {device.method && (
                  <span className="text-sm text-muted-foreground">
                    {device.method}
                  </span>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDraft({ mode: "edit", device })}
                >
                  編集
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => del.mutate(device.id)}
                >
                  削除
                </Button>
              </div>
              {device.note && (
                <p className="text-sm text-muted-foreground">{device.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
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
  const [name, setName] = useState(defaultValues.name);
  const [method, setMethod] = useState(defaultValues.method);
  const [note, setNote] = useState(defaultValues.note);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ name, method, note });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-device-name">名前</Label>
        <Input
          id="roast-device-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-device-method">方式</Label>
        <Input
          id="roast-device-method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="roast-device-note">メモ</Label>
        <Input
          id="roast-device-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
