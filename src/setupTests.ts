import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

afterEach(() => {
  cleanup();
});

// SweetAlert2 tidak perlu dirender di jsdom; cukup dipantau pemanggilannya.
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
    close: vi.fn(),
  },
}));

// Modul runtime SvelteKit diganti dengan tiruan yang bisa diatur dari pengujian.
vi.mock("$app/navigation", () => ({
  goto: vi.fn(() => Promise.resolve()),
}));

// Ikon lucide diganti komponen ringan agar ribuan berkas ikon tidak ikut dimuat.
vi.mock("lucide-svelte", async () => {
  const { default: IconMock } = await import("./__mocks__/IconMock.svelte");
  return new Proxy(
    {},
    {
      has: (_target, key) => key !== "then",
      get: (_target, key) => (key === "then" ? undefined : IconMock),
    }
  );
});

vi.mock("$app/state", async () => {
  const { mockPage } = await import("./test-utils");
  return { page: mockPage };
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => "blob:preview");
  }
}
