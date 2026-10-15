import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import AuthLayout from "./AuthLayout.svelte";
import { usersStore } from "../../users/states/usersStore";
import { resetStores, setPage, textSnippet } from "../../../test-utils";

describe("AuthLayout", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  it("menampilkan identitas Delcom Courses, teks pengenal kursus, dan konten anak", () => {
    setPage({ pathname: "/auth/login" });
    render(AuthLayout, { props: { children: textSnippet("Form Login") } });

    expect(screen.getByText("Delcom Courses")).toBeInTheDocument();
    expect(screen.getByTestId("auth-tagline")).toHaveTextContent(/kursus/i);
    expect(screen.getByTestId("children")).toHaveTextContent("Form Login");
  });

  it("menandai tab login aktif di /auth/login", () => {
    setPage({ pathname: "/auth/login" });
    render(AuthLayout, { props: { children: textSnippet("x") } });

    expect(screen.getByTestId("tab-login")).toHaveClass("bg-white");
    expect(screen.getByTestId("tab-register")).not.toHaveClass("bg-white");
    expect(screen.getByTestId("tab-register")).toHaveAttribute("href", "/auth/register");
  });

  it("menandai tab daftar aktif di /auth/register", () => {
    setPage({ pathname: "/auth/register" });
    render(AuthLayout, { props: { children: textSnippet("x") } });

    expect(screen.getByTestId("tab-register")).toHaveClass("bg-white");
    expect(screen.getByTestId("tab-login")).not.toHaveClass("bg-white");
  });

  it("memasang AuthSessionRedirect (tidak memeriksa profil tanpa token)", () => {
    const spy = vi.spyOn(usersStore, "asyncSetProfile");
    setPage({ pathname: "/auth/login" });
    render(AuthLayout, { props: { children: textSnippet("x") } });
    expect(spy).not.toHaveBeenCalled();
  });
});
