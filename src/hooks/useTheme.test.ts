import { act, renderHook } from "@testing-library/react/pure";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks/useTheme";

function makeMediaQuery(initialMatches: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const mq = {
    matches: initialMatches,
    addEventListener: vi.fn(
      (_: string, fn: (e: { matches: boolean }) => void) => {
        listeners.add(fn);
      },
    ),
    removeEventListener: vi.fn(
      (_: string, fn: (e: { matches: boolean }) => void) => {
        listeners.delete(fn);
      },
    ),
    fire: (newMatches: boolean) => {
      for (const fn of listeners) fn({ matches: newMatches });
    },
  };
  return mq;
}

describe("useTheme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  it("system: ダークモード設定時 .dark クラスが付く", () => {
    const mq = makeMediaQuery(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mq as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useTheme("system"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    unmount();
  });

  it("system: ライトモード設定時 .dark クラスが付かない", () => {
    const mq = makeMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mq as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useTheme("system"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    unmount();
  });

  it("system: 設定変更で .dark クラスがリロードなしに切り替わる", () => {
    const mq = makeMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mq as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useTheme("system"));

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => mq.fire(true));
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => mq.fire(false));
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    unmount();
  });

  it("dark: 常に .dark クラスが付く", () => {
    const mq = makeMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mq as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useTheme("dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    unmount();
  });

  it("light: 常に .dark クラスが付かない", () => {
    document.documentElement.classList.add("dark");
    const mq = makeMediaQuery(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mq as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useTheme("light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    unmount();
  });
});
