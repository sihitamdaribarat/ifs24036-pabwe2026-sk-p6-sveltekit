import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ChangeCoverModal from "./ChangeCoverModal.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { courseFixture, flush, resetStores } from "../../../test-utils";

function renderModal(props: Record<string, unknown> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const result = render(ChangeCoverModal, {
    props: { show: true, course: courseFixture(), onClose, onSuccess, ...props },
  });
  return { ...result, onClose, onSuccess };
}

const submit = () => fireEvent.submit(screen.getByTestId("submit-cover-modal-btn").closest("form")!);
const pick = (files: File[]) => fireEvent.change(screen.getByTestId("cover-file-input"), { target: { files } });

describe("ChangeCoverModal", () => {
  beforeEach(() => {
    resetStores();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
  });

  it("tidak dirender saat show=false", () => {
    renderModal({ show: false });
    expect(screen.queryByTestId("change-cover-modal")).not.toBeInTheDocument();
  });

  it("menampilkan sampul saat ini atau placeholder", () => {
    const { unmount } = renderModal();
    expect(screen.getByAltText("Sampul saat ini")).toHaveAttribute("src", "http://localhost/cover.jpeg");
    unmount();

    renderModal({ course: courseFixture({ cover: null }) });
    expect(screen.getByText("Klik untuk memilih gambar")).toBeInTheDocument();
  });

  it("memvalidasi berkas dan mewajibkan pilihan sebelum menyimpan", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const coverSpy = vi.spyOn(coursesStore, "asyncChangeCover");
    renderModal();

    await submit();
    expect(error).toHaveBeenLastCalledWith("Silakan pilih gambar sampul baru!");

    await pick([]);
    await pick([new File(["x"], "a.pdf", { type: "application/pdf" })]);
    expect(error).toHaveBeenLastCalledWith("Pilih file gambar (JPG/PNG)!");

    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 3 * 1024 * 1024 });
    await pick([big]);
    expect(error).toHaveBeenLastCalledWith("Ukuran gambar maksimal 2MB!");
    expect(coverSpy).not.toHaveBeenCalled();
  });

  it("mengunggah sampul (POST /courses/:id/cover) lalu menutup modal", async () => {
    const coverSpy = vi.spyOn(coursesStore, "asyncChangeCover").mockResolvedValue(true);
    const { onClose, onSuccess } = renderModal();
    const file = new File(["x"], "sampul.png", { type: "image/png" });

    await pick([file]);
    expect(screen.getByAltText("Pratinjau sampul")).toHaveAttribute("src", "blob:preview");
    await submit();

    expect(coverSpy).toHaveBeenCalledWith(3, file);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("tetap terbuka saat unggah gagal; tutup & batal memanggil onClose", async () => {
    vi.spyOn(coursesStore, "asyncChangeCover").mockResolvedValue(false);
    const { onClose, onSuccess } = renderModal();
    await pick([new File(["x"], "a.png", { type: "image/png" })]);
    await submit();
    await flush();
    expect(onSuccess).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByTestId("close-cover-modal-btn"));
    await fireEvent.click(screen.getByTestId("cancel-cover-modal-btn"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("menampilkan status mengunggah", () => {
    resetStores({ courses: { isCoverMutating: true } });
    renderModal();
    expect(screen.getByText("Mengunggah...")).toBeInTheDocument();
  });
});
