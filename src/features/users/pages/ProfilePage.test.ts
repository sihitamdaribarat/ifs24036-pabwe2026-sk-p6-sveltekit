import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ProfilePage from "./ProfilePage.svelte";
import { usersStore } from "../states/usersStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { profileFixture, resetStores } from "../../../test-utils";

function submitForm(testId: string) {
  return fireEvent.submit(screen.getByTestId(testId).closest("form")!);
}

describe("ProfilePage", () => {
  beforeEach(() => {
    resetStores({ users: { profile: profileFixture } });
  });

  it("menampilkan indikator memuat bila profil belum ada", () => {
    resetStores();
    render(ProfilePage);
    expect(screen.getByText("Memuat data profil...")).toBeInTheDocument();
  });

  it("menampilkan profil dengan inisial atau foto", () => {
    const { unmount } = render(ProfilePage);
    expect(screen.getByRole("heading", { name: profileFixture.name })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByTestId("profile-name-input")).toHaveValue(profileFixture.name);
    expect(screen.getByTestId("profile-email-input")).toHaveValue(profileFixture.email);
    unmount();

    resetStores({ users: { profile: { ...profileFixture, photo: "http://localhost/me.png" } } });
    render(ProfilePage);
    expect(screen.getByAltText(profileFixture.name)).toHaveAttribute("src", "http://localhost/me.png");
  });

  it("memvalidasi dan menyimpan biodata", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const putSpy = vi.spyOn(usersStore, "asyncPutProfile").mockResolvedValue(true);
    render(ProfilePage);

    await fireEvent.input(screen.getByTestId("profile-name-input"), { target: { value: " " } });
    await submitForm("submit-profile-btn");
    expect(error).toHaveBeenLastCalledWith("Nama tidak boleh kosong!");

    await fireEvent.input(screen.getByTestId("profile-name-input"), { target: { value: "Baru" } });
    await fireEvent.input(screen.getByTestId("profile-email-input"), { target: { value: " " } });
    await submitForm("submit-profile-btn");
    expect(error).toHaveBeenLastCalledWith("Email tidak boleh kosong!");
    expect(putSpy).not.toHaveBeenCalled();

    await fireEvent.input(screen.getByTestId("profile-email-input"), { target: { value: " baru@del.ac.id " } });
    await submitForm("submit-profile-btn");
    expect(putSpy).toHaveBeenCalledWith("Baru", "baru@del.ac.id");
  });

  it("menampilkan status memuat saat bendera mutasi aktif", () => {
    resetStores({
      users: {
        profile: profileFixture,
        isChangeProfile: true,
        isChangeProfilePhoto: true,
        isChangeProfilePassword: true,
      },
    });
    render(ProfilePage);
    expect(screen.getByText("Menyimpan Perubahan...")).toBeInTheDocument();
    expect(screen.getByText("Memperbarui Password...")).toBeInTheDocument();
    expect(screen.getByTestId("submit-profile-btn")).toBeDisabled();
  });

  it("memvalidasi dan mengunggah foto profil", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const photoSpy = vi.spyOn(usersStore, "asyncPostProfilePhoto").mockResolvedValue(true);
    render(ProfilePage);
    const input = screen.getByTestId("profile-photo-file-input");

    await fireEvent.change(input, { target: { files: [] } });
    expect(photoSpy).not.toHaveBeenCalled();

    await fireEvent.change(input, { target: { files: [new File(["x"], "a.txt", { type: "text/plain" })] } });
    expect(error).toHaveBeenLastCalledWith("Pilih file gambar yang valid!");

    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 4 * 1024 * 1024 });
    await fireEvent.change(input, { target: { files: [big] } });
    expect(error).toHaveBeenLastCalledWith("Ukuran file foto maksimal 3MB!");
    expect(photoSpy).not.toHaveBeenCalled();

    const ok = new File(["x"], "ok.png", { type: "image/png" });
    await fireEvent.change(input, { target: { files: [ok] } });
    expect(photoSpy).toHaveBeenCalledWith(ok);
  });

  it("memvalidasi dan mengubah kata sandi", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const pwSpy = vi.spyOn(usersStore, "asyncPutProfilePassword").mockResolvedValueOnce(false);
    render(ProfilePage);

    await submitForm("submit-password-btn");
    expect(error).toHaveBeenLastCalledWith("Kata sandi lama wajib diisi!");

    await fireEvent.input(screen.getByTestId("current-password-input"), { target: { value: "lama" } });
    await fireEvent.input(screen.getByTestId("new-password-input"), { target: { value: "123" } });
    await submitForm("submit-password-btn");
    expect(error).toHaveBeenLastCalledWith("Kata sandi baru minimal 6 karakter!");

    await fireEvent.input(screen.getByTestId("new-password-input"), { target: { value: "123456" } });
    await fireEvent.input(screen.getByTestId("confirm-password-input"), { target: { value: "654321" } });
    await submitForm("submit-password-btn");
    expect(error).toHaveBeenLastCalledWith("Konfirmasi kata sandi tidak cocok!");
    expect(pwSpy).not.toHaveBeenCalled();

    // Gagal: isian tetap dipertahankan
    await fireEvent.input(screen.getByTestId("confirm-password-input"), { target: { value: "123456" } });
    await submitForm("submit-password-btn");
    expect(pwSpy).toHaveBeenCalledWith("lama", "123456", "123456");
    await waitFor(() => expect(screen.getByTestId("current-password-input")).toHaveValue("lama"));

    // Berhasil: isian dikosongkan
    pwSpy.mockResolvedValueOnce(true);
    await submitForm("submit-password-btn");
    await waitFor(() => expect(screen.getByTestId("current-password-input")).toHaveValue(""));
    expect(screen.getByTestId("new-password-input")).toHaveValue("");
    expect(screen.getByTestId("confirm-password-input")).toHaveValue("");
  });
});
