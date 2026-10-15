import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import CourseLayout from "./CourseLayout.svelte";
import { usersStore } from "../../users/states/usersStore";
import { authStore } from "../../auth/states/authStore";
import apiHelper from "../../../helpers/apiHelper";
import { flush, profileFixture, resetStores, setPage, textSnippet } from "../../../test-utils";

function renderLayout() {
  return render(CourseLayout, { props: { children: textSnippet("Isi Halaman") } });
}

describe("CourseLayout", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
    setPage({ pathname: "/" });
  });

  it("mengarahkan ke login bila belum ada token", async () => {
    const profileSpy = vi.spyOn(usersStore, "asyncSetProfile");
    renderLayout();
    expect(screen.getByText("Memuat sesi pengguna...")).toBeInTheDocument();
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(profileSpy).not.toHaveBeenCalled();
  });

  it("menghapus token tidak valid dan mengarahkan ke login", async () => {
    apiHelper.putAccessToken("kedaluwarsa");
    vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(null);
    renderLayout();
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(apiHelper.getAccessToken()).toBeNull();
  });

  it("membungkus halaman dengan navbar dan sidebar bila profil tersedia", async () => {
    apiHelper.putAccessToken("tkn");
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(async () => {
      usersStore.setProfile(profileFixture);
      return profileFixture;
    });
    renderLayout();

    await waitFor(() => expect(screen.getByTestId("children")).toHaveTextContent("Isi Halaman"));
    expect(screen.getByTestId("navbar-brand")).toBeInTheDocument();
    expect(screen.getByText("Semua Kursus")).toBeInTheDocument();
    await flush();
    expect(goto).not.toHaveBeenCalled();
  });

  it("membuka/menutup sidebar dan melakukan logout", async () => {
    apiHelper.putAccessToken("tkn");
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(async () => {
      usersStore.setProfile(profileFixture);
      return profileFixture;
    });
    const logoutSpy = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockImplementation(async () => {
      apiHelper.putAccessToken("");
      authStore.setIsAuthLogout(true);
    });
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("sidebar")).toBeInTheDocument());

    await fireEvent.click(screen.getByTestId("toggle-sidebar-btn"));
    expect(screen.getByTestId("sidebar")).toHaveClass("translate-x-0");
    await fireEvent.click(screen.getByTestId("sidebar-backdrop"));
    expect(screen.getByTestId("sidebar")).toHaveClass("-translate-x-full");

    await fireEvent.click(screen.getByTestId("profile-dropdown-button"));
    await fireEvent.click(screen.getByTestId("dropdown-logout-button"));

    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(logoutSpy).toHaveBeenCalled();
    expect(usersStore.$state.profile).toBeNull();
    expect(authStore.$state.isAuthLogout).toBe(false);
  });
});
