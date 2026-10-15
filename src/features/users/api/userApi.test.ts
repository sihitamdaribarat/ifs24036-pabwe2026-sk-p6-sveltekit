import { describe, it, expect, vi } from "vitest";
import userApi from "./userApi";
import apiHelper from "../../../helpers/apiHelper";
import { jsonResponse, profileFixture } from "../../../test-utils";

const BASE = `${DELCOM_BASEURL}/users`;

function mockFetch(body: unknown) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue(jsonResponse(body));
}

describe("userApi", () => {
  it("getUsers mengembalikan daftar pengguna atau array kosong", async () => {
    const spy = mockFetch({ status: "success", data: { users: [profileFixture] } });
    await expect(userApi.getUsers()).resolves.toEqual([profileFixture]);
    expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "GET" });

    mockFetch({ success: true });
    await expect(userApi.getUsers()).resolves.toEqual([]);
  });

  it("getUserById dan getProfile mengembalikan data.user", async () => {
    const spy = mockFetch({ status: "success", data: { user: profileFixture } });
    await expect(userApi.getUserById(1)).resolves.toEqual(profileFixture);
    expect(spy).toHaveBeenLastCalledWith(`${BASE}/1`, { method: "GET" });
    await expect(userApi.getProfile()).resolves.toEqual(profileFixture);
    expect(spy).toHaveBeenLastCalledWith(`${BASE}/me`, { method: "GET" });
  });

  it("putProfile mengirim nama dan email", async () => {
    const spy = mockFetch({ status: "success", data: { user: profileFixture } });
    await expect(userApi.putProfile("Abdullah", "a@b.c")).resolves.toEqual(profileFixture);
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/me`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Abdullah", email: "a@b.c" }),
      })
    );
  });

  it("postProfilePhoto mengunggah foto dengan POST multipart", async () => {
    const spy = mockFetch({ status: "success", message: "Foto diperbarui" });
    const photo = new File(["x"], "foto.png", { type: "image/png" });
    await expect(userApi.postProfilePhoto(photo)).resolves.toBe("Foto diperbarui");
    const [url, options] = spy.mock.calls[0];
    expect(url).toBe(`${BASE}/me/photo`);
    expect(options.method).toBe("POST");
    expect((options.body as FormData).get("photo")).toBeInstanceOf(File);

    const unnamed = new File(["x"], "", { type: "image/png" });
    await userApi.postProfilePhoto(unnamed);
    expect(((spy.mock.calls[1][1].body as FormData).get("photo") as File).name).toBe("profile.png");
  });

  it("putProfilePassword memakai konfirmasi atau kata sandi baru sebagai cadangan", async () => {
    const spy = mockFetch({ status: "success", message: "Sandi diperbarui" });
    await expect(userApi.putProfilePassword("lama", "baru123", "baru123")).resolves.toBe(
      "Sandi diperbarui"
    );
    expect(spy).toHaveBeenLastCalledWith(
      `${BASE}/password`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          password: "lama",
          new_password: "baru123",
          new_password_confirmation: "baru123",
        }),
      })
    );

    await userApi.putProfilePassword("lama", "baru456");
    expect(JSON.parse(spy.mock.calls[1][1].body as string).new_password_confirmation).toBe("baru456");
  });

  it.each([
    ["getUsers", () => userApi.getUsers(), "Gagal mengambil data pengguna"],
    ["getUserById", () => userApi.getUserById(1), "Gagal mengambil detail pengguna"],
    ["getProfile", () => userApi.getProfile(), "Gagal mengambil data profil"],
    ["putProfile", () => userApi.putProfile("a", "b"), "Gagal mengubah profil"],
    [
      "postProfilePhoto",
      () => userApi.postProfilePhoto(new File(["x"], "a.png")),
      "Gagal mengubah foto profil",
    ],
    ["putProfilePassword", () => userApi.putProfilePassword("a", "b", "b"), "Gagal mengubah kata sandi"],
  ])("%s melempar error dengan pesan server atau bawaan", async (_name, call, fallback) => {
    mockFetch({ status: "fail", message: "Pesan server" });
    await expect(call()).rejects.toThrow("Pesan server");
    mockFetch({ status: "fail" });
    await expect(call()).rejects.toThrow(fallback);
  });
});
