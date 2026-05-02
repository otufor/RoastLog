import { Link, useNavigate } from "@tanstack/react-router";
import { BeanForm } from "@/components/BeanForm";
import { buttonVariants } from "@/components/ui/button";
import { useBean } from "@/hooks/useBeans";
import { useUpdateBean } from "@/hooks/useMutateBean";

export function BeanEditPage({ beanId }: { beanId: string }) {
  const navigate = useNavigate();
  const { data: bean, isLoading } = useBean(beanId);
  const { mutateAsync: updateBean } = useUpdateBean();

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

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{bean.name} を編集</h1>
        <Link
          to="/beans/$beanId"
          params={{ beanId: bean.id }}
          className={buttonVariants({ variant: "outline" })}
        >
          キャンセル
        </Link>
      </div>
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
      />
    </div>
  );
}
