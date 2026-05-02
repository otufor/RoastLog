import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { BeanEditPage } from "@/components/BeanEditPage";
import { db } from "@/db";

function renderAt(beanId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId/edit",
    component: () => <BeanEditPage beanId={beanId} />,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId",
    component: () => <div data-testid="detail-page">detail</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: [`/beans/${beanId}/edit`] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("BeanEditPage", () => {
  beforeEach(async () => {
    await db.beans.clear();
  });

  it("既存値を初期表示し、stockG を変更して保存すると詳細画面へ遷移する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      id,
      name: "ブラジル セラード",
      origin: "ブラジル",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 200,
      bestLogId: null,
      note: "",
    });

    const user = userEvent.setup();
    const router = renderAt(id);

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>("名前").value).toBe(
        "ブラジル セラード",
      ),
    );

    const stockInput = screen.getByLabelText<HTMLInputElement>("在庫 (g)");
    await user.clear(stockInput);
    await user.type(stockInput, "150");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/beans/${id}`),
    );
    const updated = await db.beans.get(id);
    expect(updated?.stockG).toBe(150);
  });
});
