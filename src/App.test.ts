import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRawSnippet, mount, unmount } from "svelte";
import { render, screen, waitFor } from "@testing-library/svelte";
import RootLayout from "./routes/+layout.svelte";
import HomeRoute from "./routes/+page.svelte";
import { coursesStore } from "./features/courses/states/coursesStore";
import { usersStore } from "./features/users/states/usersStore";
import apiHelper from "./helpers/apiHelper";
import { courseFixture, profileFixture, resetStores, setPage } from "./test-utils";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf-8");

/** Snippet yang me-mount komponen rute ke dalam layout, meniru router SvelteKit. */
function routeSnippet(component: typeof HomeRoute) {
  return createRawSnippet(() => ({
    render: () => "<div data-testid='route'></div>",
    setup: (target) => {
      const instance = mount(component, { target: target as HTMLElement });
      return () => unmount(instance);
    },
  }));
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  it("memakai judul aplikasi Delcom Courses dan ikon topi wisuda", () => {
    const html = read("src/app.html");
    expect(html).toContain("<title>Delcom Courses</title>");
    expect(html).toContain('href="/logo.svg"');

    const logo = read("static/logo.svg");
    // Path ikon graduation-cap dari Lucide
    expect(logo).toContain("M22 10v6");
    expect(logo).toContain("M6 12.5V16a6 3 0 0 0 12 0v-3.5");
  });

  it("memakai nama proyek dan konfigurasi port yang ditentukan", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.name).toBe("ifs24036-pabwe2026-sk-p6-sveltekit");
    expect(pkg.devDependencies["@sveltejs/adapter-bun"]).toBeDefined();
    expect(read("vite.config.ts")).toContain("3005");
    expect(DELCOM_BASEURL).toMatch(/\/api\/v1$/);
  });

  it("menampilkan daftar kursus di dalam CourseLayout untuk pengguna yang login", async () => {
    apiHelper.putAccessToken("tkn");
    setPage({ pathname: "/", routeId: "/" });
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(async () => {
      usersStore.setProfile(profileFixture);
      return profileFixture;
    });
    vi.spyOn(coursesStore, "asyncSetCourses").mockImplementation(async () => {
      coursesStore.setCourses([courseFixture()]);
    });

    render(RootLayout, { props: { children: routeSnippet(HomeRoute) } });

    await waitFor(() => expect(screen.getByTestId("course-card-3")).toBeInTheDocument());
    expect(screen.getByTestId("navbar-brand")).toHaveTextContent("Delcom Courses");
    expect(screen.getByTestId("sidebar")).toHaveTextContent("Semua Kursus");
  });
});
