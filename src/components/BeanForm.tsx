import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateBeanInput } from "@/schemas/bean";

const FormSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  origin: z.string(),
  productName: z.string(),
  shopName: z.string(),
  purchasedAt: z.string(),
  importedAt: z.string(),
  stockG: z.number(),
  note: z.string(),
});

type FormValues = z.infer<typeof FormSchema>;

function toFormValues(input: CreateBeanInput): FormValues {
  return {
    name: input.name,
    origin: input.origin,
    productName: input.productName,
    shopName: input.shopName,
    purchasedAt: input.purchasedAt ?? "",
    importedAt: input.importedAt ?? "",
    stockG: input.stockG,
    note: input.note,
  };
}

function toCreateInput(values: FormValues): CreateBeanInput {
  return {
    ...values,
    purchasedAt: values.purchasedAt === "" ? null : values.purchasedAt,
    importedAt: values.importedAt === "" ? null : values.importedAt,
  };
}

export function BeanForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues: CreateBeanInput;
  onSubmit: (input: CreateBeanInput) => void | Promise<void>;
  submitLabel: string;
}) {
  const form = useForm({
    defaultValues: toFormValues(defaultValues),
    validators: { onSubmit: FormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(toCreateInput(value));
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
            <Label htmlFor="bean-name">名前</Label>
            <Input
              id="bean-name"
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

      <form.Field name="origin">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-origin">産地</Label>
            <Input
              id="bean-origin"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="productName">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-product-name">製品名</Label>
            <Input
              id="bean-product-name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="shopName">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-shop-name">購入店</Label>
            <Input
              id="bean-shop-name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="purchasedAt">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-purchased-at">購入日</Label>
            <Input
              id="bean-purchased-at"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="importedAt">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-imported-at">輸入時期</Label>
            <Input
              id="bean-imported-at"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="stockG">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-stock-g">在庫 (g)</Label>
            <Input
              id="bean-stock-g"
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="note">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bean-note">メモ</Label>
            <Input
              id="bean-note"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
