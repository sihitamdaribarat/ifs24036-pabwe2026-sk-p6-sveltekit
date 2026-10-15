import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import RegisterPage from "./RegisterPage.svelte";
import { authStore } from "../states/authStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { flush, resetStores } from "../../../test-utils";

async function fill({ name = "", email = "", password = "", confirm = "" }) {
  await fireEvent.input(screen.getByTestId("register-name-input"), { target: { value: name } });
  await fireEvent.input(screen.getByTestId("register-email-input"), { target: { value: email } });
  await fireEvent.input(screen.getByTestId("register-password-input"), { target: { value: password } });
  await fireEvent.input(screen.getByTestId("register-password-confirm-input"), { target: { value: confirm } });
}

async function submit() {
  await fireEvent.submit(screen.getByTestId("register-submit-button").closest("form")!);
}

describe("RegisterPage", () => {
  beforeEach(() => {
    resetStores();
  });

  it.each([
    [{ name: " " }, "Nama lengkap wajib diisi!"],
    [{ name: "Budi", email: " " }, "Email wajib diisi!"],
    [{ name: "Budi", email: "b@del.ac.id" }, "Kata sandi wajib diisi!"],
    [{ name: "Budi", email: "b@del.ac.id", password: "a", confirm: "b" }, "Konfirmasi kata sandi tidak cocok!"],
  ])("validasi %o menampilkan '%s'", async (values, message) => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const registerSpy = vi.spyOn(authStore, "asyncSetIsAuthRegister");

    render(RegisterPage);
    await fill(values);
    await submit();

    expect(error).toHaveBeenCalledWith(message);
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("pendaftaran berhasil mengarahkan ke halaman login", async () => {
    let resolveRegister: (value: boolean) => void = () => {};
    const registerSpy = vi
      .spyOn(authStore, "asyncSetIsAuthRegister")
      .mockReturnValue(new Promise((resolve) => (resolveRegister = resolve)));

    render(RegisterPage);
    await fill({ name: " Budi ", email: " b@del.ac.id ", password: "rahasia", confirm: "rahasia" });
    await submit();

    expect(registerSpy).toHaveBeenCalledWith("Budi", "b@del.ac.id", "rahasia");
    expect(screen.getByText("Sedang Mendaftar...")).toBeInTheDocument();

    resolveRegister(true);
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(authStore.$state.isAuthRegister).toBe(false);
  });

  it("pendaftaran gagal tetap di halaman", async () => {
    vi.spyOn(authStore, "asyncSetIsAuthRegister").mockResolvedValue(false);

    render(RegisterPage);
    await fill({ name: "Budi", email: "b@del.ac.id", password: "x", confirm: "x" });
    await submit();
    await flush();

    expect(goto).not.toHaveBeenCalled();
    expect(screen.getByText("Daftar Sekarang")).toBeInTheDocument();
  });
});
