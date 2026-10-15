import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import NavbarComponent from "./NavbarComponent.svelte";
import { profileFixture } from "../../../test-utils";

function renderNavbar(props: Record<string, unknown> = {}) {
  const onToggleSidebar = vi.fn();
  const onLogout = vi.fn();
  const result = render(NavbarComponent, {
    props: { profile: profileFixture, onToggleSidebar, onLogout, ...props },
  });
  return { ...result, onToggleSidebar, onLogout };
}

describe("NavbarComponent", () => {
  it("menampilkan logo Delcom Courses dan data profil", () => {
    renderNavbar();
    expect(screen.getByTestId("navbar-brand")).toHaveAttribute("href", "/");
    expect(screen.getByText("Delcom Courses")).toBeInTheDocument();
    expect(screen.getByText(profileFixture.email)).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("menampilkan foto profil bila tersedia", () => {
    renderNavbar({ profile: { ...profileFixture, photo: "http://localhost/me.png" } });
    expect(screen.getByAltText(profileFixture.name)).toHaveAttribute("src", "http://localhost/me.png");
  });

  it("tombol menu memanggil onToggleSidebar", async () => {
    const { onToggleSidebar, rerender } = renderNavbar();
    await fireEvent.click(screen.getByTestId("toggle-sidebar-btn"));
    expect(onToggleSidebar).toHaveBeenCalled();
    await rerender({ isSidebarOpen: true });
    expect(screen.getByTestId("toggle-sidebar-btn")).toBeInTheDocument();
  });

  it("dropdown membuka profil dan menutup saat klik di luar", async () => {
    renderNavbar();
    await fireEvent.click(screen.getByTestId("profile-dropdown-button"));
    expect(screen.getByTestId("profile-dropdown-menu")).toBeInTheDocument();

    // Klik di dalam dropdown tidak menutupnya
    await fireEvent.mouseDown(screen.getByTestId("profile-dropdown-menu"));
    expect(screen.getByTestId("profile-dropdown-menu")).toBeInTheDocument();

    await fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("profile-dropdown-menu")).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId("profile-dropdown-button"));
    await fireEvent.click(screen.getByTestId("dropdown-profile-link"));
    expect(goto).toHaveBeenCalledWith("/profile");
    expect(screen.queryByTestId("profile-dropdown-menu")).not.toBeInTheDocument();
  });

  it("menu keluar memanggil onLogout", async () => {
    const { onLogout } = renderNavbar();
    await fireEvent.click(screen.getByTestId("profile-dropdown-button"));
    await fireEvent.click(screen.getByTestId("dropdown-logout-button"));
    expect(onLogout).toHaveBeenCalled();
    expect(screen.queryByTestId("profile-dropdown-menu")).not.toBeInTheDocument();
  });

  it("melepas listener mousedown saat dilepas", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderNavbar();
    unmount();
    expect(remove).toHaveBeenCalledWith("mousedown", expect.any(Function));
  });
});
