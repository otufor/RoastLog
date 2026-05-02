import { Link, useNavigate } from "@tanstack/react-router";
import { BeanForm } from "@/components/BeanForm";
import { buttonVariants } from "@/components/ui/button";
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
};

export function BeanCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCreateBean();

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">生豆を追加</h1>
        <Link to="/beans" className={buttonVariants({ variant: "outline" })}>
          キャンセル
        </Link>
      </div>
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
      />
    </div>
  );
}
