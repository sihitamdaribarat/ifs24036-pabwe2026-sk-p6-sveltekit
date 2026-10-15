import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import SidebarComponent from "./SidebarComponent.svelte";
import { setPage } from "../../../test-utils";

function renderSidebar(isSidebarOpen = false) {
  const onCloseMobile = vi.fn();
  render(SidebarComponent, { props: { isSidebarOpen, onCloseMobile } });
  return onCloseMobile;
}

describe("SidebarComponent", () => {
  it("menampilkan menu utama berlabel Semua Kursus", () => {
    setPage({ pathname: "/" });
    renderSidebar();
    expect(screen.getByText("Semua Kursus")).toBeInTheDocument();
    expect(screen.getByText("Semua Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Profil Saya")).toBeInTheDocument();
    expect(screen.getByTestId("nav-/")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("sidebar")).toHaveClass("-translate-x-full");
    expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
  });

  it("menandai Semua Kursus aktif pada halaman detail kursus", () => {
    setPage({ pathname: "/courses/3/contents/4" });
    renderSidebar();
    expect(screen.getByTestId("nav-/")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("nav-/users")).not.toHaveAttribute("aria-current");
  });

  it("menandai menu pengguna dan profil sesuai rute", () => {
    setPage({ pathname: "/users" });
    renderSidebar();
    expect(screen.getByTestId("nav-/users")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("nav-/")).not.toHaveAttribute("aria-current");
  });

  it("backdrop menutup sidebar lewat klik atau tombol Escape", async () => {
    setPage({ pathname: "/profile" });
    const onCloseMobile = renderSidebar(true);
    expect(screen.getByTestId("sidebar")).toHaveClass("translate-x-0");

    const backdrop = screen.getByTestId("sidebar-backdrop");
    await fireEvent.click(backdrop);
    expect(onCloseMobile).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(backdrop, { key: "Enter" });
    expect(onCloseMobile).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(backdrop, { key: "Escape" });
    expect(onCloseMobile).toHaveBeenCalledTimes(2);
  });

  it("klik menu menutup sidebar mobile", async () => {
    setPage({ pathname: "/" });
    const onCloseMobile = renderSidebar(true);
    const link = screen.getByTestId("nav-/profile");
    link.addEventListener("click", (event) => event.preventDefault());
    await fireEvent.click(link);
    expect(onCloseMobile).toHaveBeenCalled();
  });
});
