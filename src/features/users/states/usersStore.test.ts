import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { usersStore } from "./usersStore";
import userApi from "../api/userApi";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { profileFixture } from "../../../test-utils";

describe("usersStore", () => {
  beforeEach(() => {
    usersStore.reset();
  });

  it("memiliki state awal, reset parsial, dan setter", () => {
    expect(usersStore.$state.users).toEqual([]);
    usersStore.reset({ users: [profileFixture] });
    expect(get(usersStore).users).toEqual([profileFixture]);

    usersStore.setUsers([]);
    usersStore.setUser(profileFixture);
    usersStore.setProfile(profileFixture);
    usersStore.setIsProfile(true);
    usersStore.setIsChangeProfile(true);
    usersStore.setIsChangeProfilePhoto(true);
    usersStore.setIsChangeProfilePassword(true);
    expect(usersStore.$state).toEqual({
      users: [],
      user: profileFixture,
      profile: profileFixture,
      isProfile: true,
      isChangeProfile: true,
      isChangeProfilePhoto: true,
      isChangeProfilePassword: true,
    });
  });

  it("asyncSetUsers mengisi daftar atau mengosongkannya saat gagal", async () => {
    vi.spyOn(userApi, "getUsers").mockResolvedValueOnce([profileFixture]);
    await usersStore.asyncSetUsers();
    expect(usersStore.$state.users).toEqual([profileFixture]);

    vi.spyOn(userApi, "getUsers").mockRejectedValueOnce(new Error("x"));
    await usersStore.asyncSetUsers();
    expect(usersStore.$state.users).toEqual([]);
  });

  it("asyncSetUserById mengisi pengguna atau null saat gagal", async () => {
    vi.spyOn(userApi, "getUserById").mockResolvedValueOnce(profileFixture);
    await usersStore.asyncSetUserById(1);
    expect(usersStore.$state.user).toEqual(profileFixture);

    vi.spyOn(userApi, "getUserById").mockRejectedValueOnce(new Error("x"));
    await usersStore.asyncSetUserById(1);
    expect(usersStore.$state.user).toBeNull();
  });

  it("asyncSetProfile mengembalikan profil atau null dan menandai isProfile", async () => {
    vi.spyOn(userApi, "getProfile").mockResolvedValueOnce(profileFixture);
    await expect(usersStore.asyncSetProfile()).resolves.toEqual(profileFixture);
    expect(usersStore.$state.isProfile).toBe(true);

    vi.spyOn(userApi, "getProfile").mockRejectedValueOnce(new Error("x"));
    await expect(usersStore.asyncSetProfile()).resolves.toBeNull();
    expect(usersStore.$state.profile).toBeNull();
  });

  it("asyncPutProfile memperbarui profil dan menangani error", async () => {
    const success = vi.spyOn(toolsHelper, "showSuccessDialog");
    const error = vi.spyOn(toolsHelper, "showErrorDialog");

    vi.spyOn(userApi, "putProfile").mockResolvedValueOnce(profileFixture);
    await expect(usersStore.asyncPutProfile("a", "b")).resolves.toBe(true);
    expect(usersStore.$state.profile).toEqual(profileFixture);
    expect(success).toHaveBeenCalledWith("Profil berhasil diperbarui!");
    expect(usersStore.$state.isChangeProfile).toBe(false);

    vi.spyOn(userApi, "putProfile").mockRejectedValueOnce(new Error("Email dipakai"));
    await expect(usersStore.asyncPutProfile("a", "b")).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith("Email dipakai");
  });

  it("asyncPostProfilePhoto memuat ulang profil setelah unggah", async () => {
    const success = vi.spyOn(toolsHelper, "showSuccessDialog");
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const photo = new File(["x"], "a.png", { type: "image/png" });
    vi.spyOn(userApi, "getProfile").mockResolvedValue(profileFixture);

    vi.spyOn(userApi, "postProfilePhoto").mockResolvedValueOnce("Foto diperbarui");
    await expect(usersStore.asyncPostProfilePhoto(photo)).resolves.toBe(true);
    expect(success).toHaveBeenLastCalledWith("Foto diperbarui");
    expect(usersStore.$state.profile).toEqual(profileFixture);

    vi.spyOn(userApi, "postProfilePhoto").mockResolvedValueOnce("");
    await usersStore.asyncPostProfilePhoto(photo);
    expect(success).toHaveBeenLastCalledWith("Foto profil berhasil diperbarui!");

    vi.spyOn(userApi, "postProfilePhoto").mockRejectedValueOnce(new Error("Terlalu besar"));
    await expect(usersStore.asyncPostProfilePhoto(photo)).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith("Terlalu besar");
    expect(usersStore.$state.isChangeProfilePhoto).toBe(false);
  });

  it("asyncPutProfilePassword menampilkan pesan sesuai hasil", async () => {
    const success = vi.spyOn(toolsHelper, "showSuccessDialog");
    const error = vi.spyOn(toolsHelper, "showErrorDialog");

    vi.spyOn(userApi, "putProfilePassword").mockResolvedValueOnce("Sandi diperbarui");
    await expect(usersStore.asyncPutProfilePassword("a", "b", "b")).resolves.toBe(true);
    expect(success).toHaveBeenLastCalledWith("Sandi diperbarui");

    vi.spyOn(userApi, "putProfilePassword").mockResolvedValueOnce("");
    await usersStore.asyncPutProfilePassword("a", "b", "b");
    expect(success).toHaveBeenLastCalledWith("Kata sandi berhasil diperbarui!");

    vi.spyOn(userApi, "putProfilePassword").mockRejectedValueOnce(new Error("Sandi lama salah"));
    await expect(usersStore.asyncPutProfilePassword("a", "b", "b")).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith("Sandi lama salah");
  });
});
