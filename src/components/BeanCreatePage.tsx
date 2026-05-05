import { useNavigate } from "@tanstack/react-router";
import { BeanForm } from "@/components/BeanForm";
import { useCreateBean } from "@/hooks/useMutateBean";
import type { CreateBeanInput } from "@/schemas/bean";

const emptyDefaults: CreateBeanInput = {
  name: "",
  origin: "",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 0,
  note: "",
  totalG: 0,
  flavorTagIds: [],
  process: "",
  region: "",
  altitude: "",
  variety: "",
};

export function BeanCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCreateBean();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: "var(--background)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div
          style={{
            flex: 1,
            fontWeight: 500,
            fontSize: 18,
            color: "var(--foreground)",
          }}
        >
          豆を追加
        </div>
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
        <BeanForm
          defaultValues={emptyDefaults}
          submitLabel="登録"
          onSubmit={async (input) => {
            const bean = await mutateAsync(input);
            await navigate({
              to: "/beans/$beanId",
              params: { beanId: bean.id },
            });
          }}
          onCancel={() => navigate({ to: "/beans" })}
        />
      </div>
    </div>
  );
}
