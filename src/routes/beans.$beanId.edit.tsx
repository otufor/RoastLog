import { createFileRoute } from "@tanstack/react-router";
import { BeanEditPage } from "@/components/BeanEditPage";

export const Route = createFileRoute("/beans/$beanId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { beanId } = Route.useParams();
  return <BeanEditPage beanId={beanId} />;
}
