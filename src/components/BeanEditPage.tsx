import { useNavigate } from "@tanstack/react-router";
import { BeanForm } from "@/components/BeanForm";
import { useBean } from "@/hooks/useBeans";
import { useUpdateBean } from "@/hooks/useMutateBean";

export function BeanEditPage({ beanId }: { beanId: string }) {
  const navigate = useNavigate();
  const { data: bean, isLoading } = useBean(beanId);
  const { mutateAsync: updateBean } = useUpdateBean();

  if (isLoading) return null;
  if (!bean) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--muted-foreground)" }}>生豆が見つかりません</p>
      </div>
    );
  }

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
          padding: "0 8px",
          background: "var(--background)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <button
          type="button"
          aria-label="戻る"
          onClick={() =>
            navigate({ to: "/beans/$beanId", params: { beanId: bean.id } })
          }
          style={{
            width: 44,
            height: 44,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
          }}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div
          style={{
            flex: 1,
            fontWeight: 500,
            fontSize: 18,
            color: "var(--foreground)",
            paddingRight: 44,
            textAlign: "center",
          }}
        >
          豆を編集
        </div>
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
        <BeanForm
          defaultValues={{
            name: bean.name,
            origin: bean.origin,
            productName: bean.productName,
            shopName: bean.shopName,
            purchasedAt: bean.purchasedAt,
            importedAt: bean.importedAt,
            stockG: bean.stockG,
            note: bean.note,
            totalG: bean.totalG,
            flavorTagIds: bean.flavorTagIds,
            process: bean.process,
            region: bean.region,
            altitude: bean.altitude,
            variety: bean.variety,
          }}
          submitLabel="保存"
          onSubmit={async (input) => {
            await updateBean({
              ...bean,
              ...input,
            });
            await navigate({
              to: "/beans/$beanId",
              params: { beanId: bean.id },
            });
          }}
          onCancel={() =>
            navigate({ to: "/beans/$beanId", params: { beanId: bean.id } })
          }
        />
      </div>
    </div>
  );
}
