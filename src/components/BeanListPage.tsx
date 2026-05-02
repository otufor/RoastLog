import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { useBeans } from "@/hooks/useBeans";

export function BeanListPage() {
  const { data: beans, isLoading } = useBeans();

  if (isLoading) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">生豆</h1>
        <Link to="/beans/new" className={buttonVariants()}>
          生豆を追加
        </Link>
      </div>

      {beans?.length === 0 ? (
        <p className="text-muted-foreground">生豆が登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {beans?.map((bean) => (
            <li key={bean.id}>
              <Link
                to="/beans/$beanId"
                params={{ beanId: bean.id }}
                className="block p-4 border rounded-lg hover:bg-accent"
              >
                <p className="font-medium">{bean.name}</p>
                {bean.origin && (
                  <p className="text-sm text-muted-foreground">{bean.origin}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  在庫: {bean.stockG}g
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
