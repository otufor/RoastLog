import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useFlavorTags } from "@/hooks/useFlavorTags";
import type { CreateBeanInput } from "@/schemas/bean";

const PROCESSES = ["Washed", "Natural", "Honey", "Anaerobic"] as const;

const FormSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  origin: z.string(),
  productName: z.string(),
  shopName: z.string(),
  purchasedAt: z.string(),
  importedAt: z.string(),
  stockG: z.number().nonnegative("在庫は 0 以上で入力してください"),
  note: z.string(),
  totalG: z.number().nonnegative("購入量は 0 以上で入力してください"),
  flavorTagIds: z.array(z.string()),
  process: z.string(),
  region: z.string(),
  altitude: z.string(),
  variety: z.string(),
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
    totalG: input.totalG ?? 0,
    flavorTagIds: input.flavorTagIds ?? [],
    process: input.process ?? "",
    region: input.region ?? "",
    altitude: input.altitude ?? "",
    variety: input.variety ?? "",
  };
}

function toCreateInput(values: FormValues): CreateBeanInput {
  return {
    ...values,
    purchasedAt: values.purchasedAt === "" ? null : values.purchasedAt,
    importedAt: values.importedAt === "" ? null : values.importedAt,
  };
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "var(--muted-foreground)",
        marginBottom: 6,
        display: "block",
      }}
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 44,
          padding: "0 12px",
          background: "var(--muted)",
          border: "0.5px solid var(--border)",
          borderRadius: 8,
          fontSize: 14,
          color: "var(--foreground)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export function BeanForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues: CreateBeanInput;
  onSubmit: (input: CreateBeanInput) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const { data: flavorTags = [] } = useFlavorTags();

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
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* 名前 */}
      <form.Field name="name">
        {(field) => (
          <div>
            <FieldLabel htmlFor="bean-name">名前</FieldLabel>
            <input
              id="bean-name"
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="例: エチオピア イルガチェフェ"
              style={{
                width: "100%",
                height: 44,
                padding: "0 12px",
                background: "var(--muted)",
                border: `0.5px solid ${field.state.meta.errors.length > 0 ? "#B83232" : "var(--border)"}`,
                borderRadius: 8,
                fontSize: 14,
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message}
                  role="alert"
                  style={{
                    fontSize: 12,
                    color: "#B83232",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  {err.message}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>

      {/* 産地 */}
      <form.Field name="origin">
        {(field) => (
          <TextInput
            id="bean-origin"
            label="産地"
            value={field.state.value}
            onChange={field.handleChange}
            placeholder="例: エチオピア"
          />
        )}
      </form.Field>

      {/* 地域 */}
      <form.Field name="region">
        {(field) => (
          <TextInput
            id="bean-region"
            label="地域"
            value={field.state.value}
            onChange={field.handleChange}
            placeholder="例: イルガチェフェ"
          />
        )}
      </form.Field>

      {/* 精製方法 */}
      <form.Field name="process">
        {(field) => (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--muted-foreground)",
                marginBottom: 6,
              }}
            >
              精製方法
            </legend>
            <div style={{ display: "flex", gap: 6 }}>
              {PROCESSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={field.state.value === p}
                  onClick={() => field.handleChange(p)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    background:
                      field.state.value === p
                        ? "var(--primary)"
                        : "var(--muted)",
                    color:
                      field.state.value === p
                        ? "var(--primary-foreground)"
                        : "var(--muted-foreground)",
                    border:
                      field.state.value === p
                        ? "0.5px solid var(--primary)"
                        : "0.5px solid transparent",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      {/* 標高 / 品種 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <form.Field name="altitude">
          {(field) => (
            <TextInput
              id="bean-altitude"
              label="標高"
              value={field.state.value}
              onChange={field.handleChange}
              placeholder="例: 1800m"
            />
          )}
        </form.Field>
        <form.Field name="variety">
          {(field) => (
            <TextInput
              id="bean-variety"
              label="品種"
              value={field.state.value}
              onChange={field.handleChange}
              placeholder="例: Heirloom"
            />
          )}
        </form.Field>
      </div>

      {/* 購入先 / 購入日 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <form.Field name="shopName">
          {(field) => (
            <TextInput
              id="bean-shop-name"
              label="購入先"
              value={field.state.value}
              onChange={field.handleChange}
              placeholder="例: Sweet Maria's"
            />
          )}
        </form.Field>
        <form.Field name="purchasedAt">
          {(field) => (
            <TextInput
              id="bean-purchased-at"
              label="購入日"
              value={field.state.value}
              onChange={field.handleChange}
              placeholder="2025-04-01"
            />
          )}
        </form.Field>
      </div>

      {/* 購入量 / 在庫 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <form.Field name="totalG">
          {(field) => (
            <TextInput
              id="bean-total-g"
              label="購入量 (g)"
              type="number"
              value={field.state.value}
              onChange={(v) => field.handleChange(Number(v))}
              placeholder="400"
            />
          )}
        </form.Field>
        <form.Field name="stockG">
          {(field) => (
            <TextInput
              id="bean-stock-g"
              label="在庫 (g)"
              type="number"
              value={field.state.value}
              onChange={(v) => field.handleChange(Number(v))}
              placeholder="400"
            />
          )}
        </form.Field>
      </div>

      {/* フレーバータグ */}
      {flavorTags.length > 0 && (
        <form.Field name="flavorTagIds">
          {(field) => (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  marginBottom: 6,
                }}
              >
                フレーバーノート（任意）
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {flavorTags.map((tag) => {
                  const selected = field.state.value.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        const next = selected
                          ? field.state.value.filter((id) => id !== tag.id)
                          : [...field.state.value, tag.id];
                        field.handleChange(next);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        background: selected
                          ? `${tag.color}1A`
                          : "var(--muted)",
                        color: selected ? tag.color : "var(--muted-foreground)",
                        border: selected
                          ? `0.5px solid ${tag.color}66`
                          : "0.5px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: selected
                            ? tag.color
                            : "var(--muted-foreground)",
                        }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        </form.Field>
      )}

      {/* メモ */}
      <form.Field name="note">
        {(field) => (
          <div>
            <FieldLabel htmlFor="bean-note">メモ</FieldLabel>
            <textarea
              id="bean-note"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="香りや味わいの傾向など…"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--muted)",
                border: "0.5px solid var(--border)",
                borderRadius: 8,
                fontFamily: "Georgia, serif",
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--foreground)",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}
      </form.Field>

      <button
        type="submit"
        style={{
          width: "100%",
          height: 52,
          borderRadius: 10,
          border: 0,
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "0.5px solid var(--border)",
            background: "transparent",
            color: "var(--muted-foreground)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          キャンセル
        </button>
      )}
    </form>
  );
}
