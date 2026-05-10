import {
  createMemoryHistory,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react/pure";
import { describe, expect, it } from "vitest";
import { Route as RootRoute } from "@/routes/__root";

function renderRoot() {
  const indexRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/",
    component: () => null,
  });
  const router = createRouter({
    routeTree: RootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("RootLayout", () => {
  it("コンテンツ領域が overflow: auto でスクロール可能", async () => {
    const { container } = renderRoot();
    await waitFor(() => {
      // container > root(overflow:hidden) > contentArea(overflow:auto)
      const contentArea = container.firstElementChild
        ?.firstElementChild as HTMLElement | null;
      expect(contentArea).not.toBeNull();
      expect(contentArea?.style.overflow).toBe("auto");
    });
  });

  it("BottomTabBar が常に表示される", async () => {
    const { container } = renderRoot();
    await waitFor(() => {
      expect(container.querySelector("nav")).not.toBeNull();
    });
  });
});
