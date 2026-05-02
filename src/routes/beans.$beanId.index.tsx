import { createFileRoute } from "@tanstack/react-router";
import { BeanDetailPage } from "@/components/BeanDetailPage";

export const Route = createFileRoute("/beans/$beanId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { beanId } = Route.useParams();
  return <BeanDetailPage beanId={beanId} />;
}
