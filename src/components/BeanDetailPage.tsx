import { Link, useNavigate } from "@tanstack/react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { monthsSincePurchase } from "@/domain/bean";
import { useBean } from "@/hooks/useBeans";
import { useDeleteBean } from "@/hooks/useMutateBean";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

export function BeanDetailPage({ beanId }: { beanId: string }) {
  const navigate = useNavigate();
  const { data: bean, isLoading } = useBean(beanId);
  const { mutateAsync: deleteBean } = useDeleteBean();

  if (isLoading) return null;
  if (!bean) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">生豆が見つかりません</p>
        <Link to="/beans" className={buttonVariants({ variant: "outline" })}>
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const months = monthsSincePurchase(bean.purchasedAt, new Date());

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{bean.name}</h1>
        <div className="flex gap-2">
          <Link
            to="/beans/$beanId/edit"
            params={{ beanId: bean.id }}
            className={buttonVariants({ variant: "outline" })}
          >
            編集
          </Link>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!window.confirm("この生豆を削除しますか？")) return;
              await deleteBean(bean.id);
              await navigate({ to: "/beans" });
            }}
          >
            削除
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4">
        <Field label="産地" value={bean.origin} />
        <Field label="製品名" value={bean.productName} />
        <Field label="購入店" value={bean.shopName} />
        <Field label="在庫" value={`${bean.stockG}g`} />
        <Field label="購入日" value={bean.purchasedAt ?? ""} />
        <Field label="輸入時期" value={bean.importedAt ?? ""} />
        <Field
          label="購入からの経過月数"
          value={months === null ? "" : `${months} ヶ月`}
        />
      </section>

      <section>
        <h2 className="mb-1 text-xs text-muted-foreground">メモ</h2>
        <p className="text-sm whitespace-pre-wrap">{bean.note || "—"}</p>
      </section>

      <section className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        RoastLog 履歴・BestRecipe は次のスライスで実装
      </section>
    </div>
  );
}
