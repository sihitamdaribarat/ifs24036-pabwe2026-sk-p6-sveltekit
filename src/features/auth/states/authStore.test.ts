import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { authStore } from "./authStore";
import authApi from "../api/authApi";
import apiHelper from "../../../helpers/apiHelper";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("authStore", () => {
  beforeEach(() => {
    authStore.reset();
    localStorage.clear();
  });

  it("memiliki state awal dan dapat di-reset dengan state parsial", () => {
    expect(authStore.$state).toEqual({
      isAuthLogin: false,
      isAuthRegister: false,
      isAuthLogout: false,
    });
    authStore.reset({ isAuthLogin: true });
    expect(get(authStore).isAuthLogin).toBe(true);
  });

  it("setter memperbarui bendera", () => {
    authStore.setIsAuthLogin(true);
    authStore.setIsAuthRegister(true);
    authStore.setIsAuthLogout(true);
    expect(authStore.$state).toEqual({
      isAuthLogin: true,
      isAuthRegister: true,
      isAuthLogout: true,
    });
  });

  describe("asyncSetIsAuthLogin", () => {
    it("menyimpan token saat login berhasil", async () => {
      vi.spyOn(authApi, "postLogin").mockResolvedValue({ token: "tkn" });
      await expect(authStore.asyncSetIsAuthLogin("a@b.c", "x")).resolves.toBe(true);
      expect(apiHelper.getAccessToken()).toBe("tkn");
      expect(authStore.$state.isAuthLogin).toBe(true);
    });

    it("menampilkan error saat login gagal", async () => {
      const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog");
      vi.spyOn(authApi, "postLogin").mockRejectedValue(new Error("Kredensial salah"));
      await expect(authStore.asyncSetIsAuthLogin("a", "b")).resolves.toBe(false);
      expect(errorSpy).toHaveBeenCalledWith("Kredensial salah");
      expect(authStore.$state.isAuthLogin).toBe(false);
    });
  });

  describe("asyncSetIsAuthRegister", () => {
    it("menampilkan pesan sukses saat pendaftaran berhasil", async () => {
      const successSpy = vi.spyOn(toolsHelper, "showSuccessDialog");
      vi.spyOn(authApi, "postRegister").mockResolvedValue("Berhasil mendaftar");
      await expect(authStore.asyncSetIsAuthRegister("a", "b", "c")).resolves.toBe(true);
      expect(successSpy).toHaveBeenCalledWith("Berhasil mendaftar");
      expect(authStore.$state.isAuthRegister).toBe(true);
    });

    it("menampilkan error saat pendaftaran gagal", async () => {
      const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog");
      vi.spyOn(authApi, "postRegister").mockRejectedValue(new Error("Email sudah dipakai"));
      await expect(authStore.asyncSetIsAuthRegister("a", "b", "c")).resolves.toBe(false);
      expect(errorSpy).toHaveBeenCalledWith("Email sudah dipakai");
    });
  });

  describe("asyncSetIsAuthLogout", () => {
    it("menghapus token setelah logout berhasil", async () => {
      apiHelper.putAccessToken("tkn");
      vi.spyOn(authApi, "postLogout").mockResolvedValue("OK");
      await authStore.asyncSetIsAuthLogout();
      expect(apiHelper.getAccessToken()).toBeNull();
      expect(authStore.$state.isAuthLogout).toBe(true);
    });

    it("tetap menghapus token walaupun server gagal", async () => {
      apiHelper.putAccessToken("tkn");
      vi.spyOn(authApi, "postLogout").mockRejectedValue(new Error("Server error"));
      await authStore.asyncSetIsAuthLogout();
      expect(apiHelper.getAccessToken()).toBeNull();
      expect(authStore.$state.isAuthLogout).toBe(true);
    });
  });
});
