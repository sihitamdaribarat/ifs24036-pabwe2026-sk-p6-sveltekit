import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import LoginPage from "./LoginPage.svelte";
import { authStore } from "../states/authStore";
import { usersStore } from "../../users/states/usersStore";
import apiHelper from "../../../helpers/apiHelper";
import { flush, profileFixture, resetStores } from "../../../test-utils";

async function fillAndSubmit() {
  await fireEvent.input(screen.getByTestId("login-email-input"), { target: { value: "a@del.ac.id" } });
  await fireEvent.input(screen.getByTestId("login-password-input"), { target: { value: "rahasia" } });
  await fireEvent.submit(screen.getByTestId("login-submit-button").closest("form")!);
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  it("login berhasil lalu memuat profil dan goto('/')", async () => {
    const loginSpy = vi.spyOn(authStore, "asyncSetIsAuthLogin").mockImplementation(async () => {
      apiHelper.putAccessToken("tkn");
      return true;
    });
    vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(profileFixture);

    render(LoginPage);
    await fillAndSubmit();

    expect(loginSpy).toHaveBeenCalledWith("a@del.ac.id", "rahasia");
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
    expect(apiHelper.getAccessToken()).toBe("tkn");
  });

  it("menampilkan status memuat selama proses login", async () => {
    let resolveLogin: (value: boolean) => void = () => {};
    vi.spyOn(authStore, "asyncSetIsAuthLogin").mockReturnValue(
      new Promise((resolve) => (resolveLogin = resolve))
    );

    render(LoginPage);
    await fillAndSubmit();
    expect(screen.getByText("Sedang Masuk...")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-button")).toBeDisabled();

    resolveLogin(false);
    await waitFor(() => expect(screen.getByText("Masuk Sekarang")).toBeInTheDocument());
  });

  it("tidak memuat profil bila login gagal", async () => {
    vi.spyOn(authStore, "asyncSetIsAuthLogin").mockResolvedValue(false);
    const profileSpy = vi.spyOn(usersStore, "asyncSetProfile");

    render(LoginPage);
    await fillAndSubmit();
    await flush();

    expect(profileSpy).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it("menghapus token bila login berhasil tetapi profil tidak tersedia", async () => {
    vi.spyOn(authStore, "asyncSetIsAuthLogin").mockImplementation(async () => {
      apiHelper.putAccessToken("tkn");
      return true;
    });
    vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(null);

    render(LoginPage);
    await fillAndSubmit();

    await waitFor(() => expect(apiHelper.getAccessToken()).toBeNull());
    expect(goto).not.toHaveBeenCalled();
  });
});
