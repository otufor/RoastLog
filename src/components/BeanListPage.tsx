import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBeans } from "@/hooks/useBeans";
import { useCreateBean } from "@/hooks/useMutateBean";

function CreateBeanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync } = useCreateBean();
  const form = useForm({
    defaultValues: { name: "", stockG: 0 },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "名前は必須です"),
        stockG: z.number(),
      }),
    },
    onSubmit: async ({ value }) => {
      await mutateAsync({
        name: value.name,
        stockG: value.stockG,
        origin: "",
        productName: "",
        shopName: "",
        purchasedAt: null,
        importedAt: null,
        note: "",
      });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>生豆を追加</DialogTitle>
        </DialogHeader>
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
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((err) => (
                  <span
                    key={String(err)}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {String(err)}
                  </span>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="stockG">
            {(field) => (
              <div className="flex flex-col gap-1">
                <Label htmlFor="stockG">在庫 (g)</Label>
                <Input
                  id="stockG"
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
            )}
          </form.Field>
          <Button type="submit">登録</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BeanListPage() {
  const { data: beans, isLoading } = useBeans();
  const [open, setOpen] = useState(false);

  if (isLoading) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">生豆</h1>
        <Button onClick={() => setOpen(true)}>生豆を追加</Button>
      </div>

      {beans?.length === 0 ? (
        <p className="text-muted-foreground">生豆が登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {beans?.map((bean) => (
            <li key={bean.id} className="p-4 border rounded-lg">
              <p className="font-medium">{bean.name}</p>
              <p className="text-sm text-muted-foreground">
                在庫: {bean.stockG}g
              </p>
            </li>
          ))}
        </ul>
      )}

      <CreateBeanDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
