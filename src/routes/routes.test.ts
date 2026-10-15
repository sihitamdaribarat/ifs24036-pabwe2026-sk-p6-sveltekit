import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import RootLayout from "./+layout.svelte";
import * as rootLayoutConfig from "./+layout";
import HomeRoute from "./+page.svelte";
import ErrorRoute from "./+error.svelte";
import AuthLayoutRoute from "./auth/+layout.svelte";
import LoginRoute from "./auth/login/+page.svelte";
import RegisterRoute from "./auth/register/+page.svelte";
import CourseDetailRoute from "./courses/[courseId]/+page.svelte";
import CourseContentRoute from "./courses/[courseId]/contents/[contentId]/+page.svelte";
import UsersRoute from "./users/+page.svelte";
import ProfileRoute from "./profile/+page.svelte";
import { coursesStore } from "../features/courses/states/coursesStore";
import { usersStore } from "../features/users/states/usersStore";
import { profileFixture, resetStores, setPage, textSnippet } from "../test-utils";

describe("routes", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
    setPage({ pathname: "/" });
  });

  describe("+layout", () => {
    it("menonaktifkan SSR karena token tersimpan di localStorage", () => {
      expect(rootLayoutConfig.ssr).toBe(false);
      expect(rootLayoutConfig.prerender).toBe(false);
    });

    it("rute /auth tidak dibungkus CourseLayout", () => {
      setPage({ pathname: "/auth/login", routeId: "/auth/login" });
      render(RootLayout, { props: { children: textSnippet("Halaman Auth") } });
      expect(screen.getByTestId("children")).toHaveTextContent("Halaman Auth");
      expect(screen.queryByText("Memuat sesi pengguna...")).not.toBeInTheDocument();
    });

    it("halaman galat tidak dibungkus CourseLayout", () => {
      setPage({ pathname: "/tidak-ada", routeId: null, status: 404, error: { message: "Not Found" } });
      render(RootLayout, { props: { children: textSnippet("Galat") } });
      expect(screen.getByTestId("children")).toHaveTextContent("Galat");
      expect(screen.queryByText("Memuat sesi pengguna...")).not.toBeInTheDocument();
    });

    it("rute lain dibungkus CourseLayout", () => {
      setPage({ pathname: "/users", routeId: "/users" });
      render(RootLayout, { props: { children: textSnippet("Isi") } });
      expect(screen.getByText("Memuat sesi pengguna...")).toBeInTheDocument();
    });
  });

  it("/ menampilkan daftar kursus", () => {
    const load = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue();
    usersStore.setProfile(profileFixture);
    render(HomeRoute);
    expect(screen.getByRole("heading", { name: "Semua Kursus" })).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith(false);
  });

  it("+error menampilkan halaman tidak ditemukan", () => {
    render(ErrorRoute);
    expect(screen.getByText("Halaman Tidak Ditemukan")).toBeInTheDocument();
  });

  it("/auth memakai AuthLayout", () => {
    setPage({ pathname: "/auth/login" });
    render(AuthLayoutRoute, { props: { children: textSnippet("Form") } });
    expect(screen.getByTestId("auth-tagline")).toBeInTheDocument();
    expect(screen.getByTestId("children")).toHaveTextContent("Form");
  });

  it("/auth/login dan /auth/register tetap tersedia", () => {
    const { unmount } = render(LoginRoute);
    expect(screen.getByTestId("login-submit-button")).toBeInTheDocument();
    unmount();
    render(RegisterRoute);
    expect(screen.getByTestId("register-submit-button")).toBeInTheDocument();
  });

  it("/courses/[courseId] membaca parameter courseId", async () => {
    const load = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(null);
    setPage({ pathname: "/courses/42", params: { courseId: "42" }, routeId: "/courses/[courseId]" });
    render(CourseDetailRoute);
    await waitFor(() => expect(load).toHaveBeenCalledWith("42"));
  });

  it("/courses/[courseId]/contents/[contentId] membaca kedua parameter", async () => {
    const loadCourse = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(null);
    const loadContent = vi.spyOn(coursesStore, "asyncSetContent").mockResolvedValue(null);
    setPage({
      pathname: "/courses/42/contents/7",
      params: { courseId: "42", contentId: "7" },
      routeId: "/courses/[courseId]/contents/[contentId]",
    });
    render(CourseContentRoute);
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith("7"));
    expect(loadCourse).toHaveBeenCalledWith("42");
  });

  it("/users dan /profile tetap tersedia", () => {
    vi.spyOn(usersStore, "asyncSetUsers").mockResolvedValue();
    const { unmount } = render(UsersRoute);
    expect(screen.getByRole("heading", { name: "Semua Pengguna" })).toBeInTheDocument();
    unmount();

    usersStore.setProfile(profileFixture);
    render(ProfileRoute);
    expect(screen.getByRole("heading", { name: "Profil Akun" })).toBeInTheDocument();
  });
});
