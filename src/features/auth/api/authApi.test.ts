import { describe, it, expect, vi } from "vitest";
import authApi from "./authApi";
import apiHelper from "../../../helpers/apiHelper";
import { jsonResponse } from "../../../test-utils";

function mockFetch(body: unknown) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue(jsonResponse(body));
}

describe("authApi", () => {
  describe("postRegister", () => {
    it("mengirim data pendaftaran dan mengembalikan pesan", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mendaftar" });
      await expect(authApi.postRegister("Budi", "budi@del.ac.id", "rahasia")).resolves.toBe(
        "Berhasil mendaftar"
      );
      expect(spy).toHaveBeenCalledWith(
        `${DELCOM_BASEURL}/auth/register`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Budi", email: "budi@del.ac.id", password: "rahasia" }),
        })
      );
    });

    it("menerima format respons success: true", async () => {
      mockFetch({ success: true, message: "OK" });
      await expect(authApi.postRegister("a", "b", "c")).resolves.toBe("OK");
    });

    it("menggabungkan pesan validasi ke dalam error", async () => {
      mockFetch({ status: "fail", message: "Data tidak valid", data: { email: ["Email sudah dipakai"] } });
      await expect(authApi.postRegister("a", "b", "c")).rejects.toThrow(
        "Data tidak valid: Email sudah dipakai"
      );
    });

    it("memakai pesan bawaan bila server tidak memberi detail", async () => {
      mockFetch({ status: "fail" });
      await expect(authApi.postRegister("a", "b", "c")).rejects.toThrow("Gagal melakukan pendaftaran");

      mockFetch({ status: "fail", message: "Ditolak", data: "bukan-objek" });
      await expect(authApi.postRegister("a", "b", "c")).rejects.toThrow(/^Ditolak$/);

      mockFetch({ status: "fail", message: "Kosong", data: {} });
      await expect(authApi.postRegister("a", "b", "c")).rejects.toThrow(/^Kosong$/);
    });
  });

  describe("postLogin", () => {
    it("mengembalikan data token", async () => {
      const spy = mockFetch({ status: "success", data: { token: "abc" } });
      await expect(authApi.postLogin("a@b.c", "x")).resolves.toEqual({ token: "abc" });
      expect(spy).toHaveBeenCalledWith(
        `${DELCOM_BASEURL}/auth/login`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("melempar error dengan pesan server atau pesan bawaan", async () => {
      mockFetch({ status: "fail", message: "Kredensial salah" });
      await expect(authApi.postLogin("a", "b")).rejects.toThrow("Kredensial salah");
      mockFetch({ status: "fail" });
      await expect(authApi.postLogin("a", "b")).rejects.toThrow("Gagal login");
    });
  });

  describe("postLogout", () => {
    it("mengembalikan pesan logout", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil logout" });
      await expect(authApi.postLogout()).resolves.toBe("Berhasil logout");
      expect(spy).toHaveBeenCalledWith(
        `${DELCOM_BASEURL}/auth/logout`,
        expect.objectContaining({ method: "POST" })
      );
    });

    it("melempar error dengan pesan server atau pesan bawaan", async () => {
      mockFetch({ status: "fail", message: "Unauthenticated." });
      await expect(authApi.postLogout()).rejects.toThrow("Unauthenticated.");
      mockFetch({ status: "fail" });
      await expect(authApi.postLogout()).rejects.toThrow("Gagal logout");
    });
  });
});
