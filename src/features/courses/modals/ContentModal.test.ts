import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ContentModal from "./ContentModal.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { contentFixture, flush, resetStores } from "../../../test-utils";

function renderModal(props: Record<string, unknown> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const result = render(ContentModal, {
    props: { show: true, courseId: 3, onClose, onSuccess, ...props },
  });
  return { ...result, onClose, onSuccess };
}

async function fill(title: string, youtube: string) {
  await fireEvent.input(screen.getByTestId("content-title-input"), { target: { value: title } });
  await fireEvent.input(screen.getByTestId("content-youtube-input"), { target: { value: youtube } });
}

const submit = () => fireEvent.submit(screen.getByTestId("submit-content-modal-btn").closest("form")!);

describe("ContentModal", () => {
  beforeEach(() => resetStores());

  it("tidak dirender saat show=false", () => {
    renderModal({ show: false });
    expect(screen.queryByTestId("content-modal")).not.toBeInTheDocument();
  });

  it("mode tambah: formulir kosong dan memanggil asyncAddContent", async () => {
    const addSpy = vi.spyOn(coursesStore, "asyncAddContent").mockResolvedValue(true);
    const { onClose, onSuccess } = renderModal();
    expect(screen.getByText("Tambah Konten Kursus")).toBeInTheDocument();
    expect(screen.getByTestId("content-title-input")).toHaveValue("");

    await fill(" Pointer ", " https://youtu.be/uHyfQV0kbgo ");
    await submit();

    expect(addSpy).toHaveBeenCalledWith(3, "Pointer", "https://youtu.be/uHyfQV0kbgo");
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("mode ubah: formulir terisi dan memanggil asyncChangeContent", async () => {
    const changeSpy = vi.spyOn(coursesStore, "asyncChangeContent").mockResolvedValue(true);
    const { onSuccess } = renderModal({ content: contentFixture() });
    expect(screen.getByText("Ubah Konten Kursus")).toBeInTheDocument();
    expect(screen.getByText("Perbarui Konten")).toBeInTheDocument();
    expect(screen.getByTestId("content-title-input")).toHaveValue("Pengenalan Pointer");
    expect(screen.getByTestId("content-youtube-input")).toHaveValue("https://youtu.be/uHyfQV0kbgo");

    await fill("Pointer Lanjut", "https://www.youtube.com/watch?v=uHyfQV0kbgo");
    await submit();
    expect(changeSpy).toHaveBeenCalledWith(4, "Pointer Lanjut", "https://www.youtube.com/watch?v=uHyfQV0kbgo");
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("memvalidasi judul dan tautan YouTube", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const addSpy = vi.spyOn(coursesStore, "asyncAddContent");
    renderModal();

    await fill(" ", "https://youtu.be/uHyfQV0kbgo");
    await submit();
    expect(error).toHaveBeenLastCalledWith("Judul konten tidak boleh kosong");

    await fill("Materi", "https://vimeo.com/123");
    await submit();
    expect(error).toHaveBeenLastCalledWith("Masukkan tautan YouTube yang valid");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("tetap terbuka saat gagal; tutup & batal memanggil onClose", async () => {
    vi.spyOn(coursesStore, "asyncAddContent").mockResolvedValue(false);
    const { onClose, onSuccess } = renderModal();
    await fill("Materi", "https://youtu.be/uHyfQV0kbgo");
    await submit();
    await flush();
    expect(onSuccess).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByTestId("close-content-modal-btn"));
    await fireEvent.click(screen.getByTestId("cancel-content-modal-btn"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("menampilkan status menyimpan", () => {
    resetStores({ courses: { isContentMutating: true } });
    renderModal();
    expect(screen.getByText("Menyimpan...")).toBeInTheDocument();
  });
});
