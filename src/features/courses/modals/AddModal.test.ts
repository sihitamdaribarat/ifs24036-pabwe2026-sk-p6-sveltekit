import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import AddModal from "./AddModal.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { flush, resetStores } from "../../../test-utils";

function renderModal(show = true) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const result = render(AddModal, { props: { show, onClose, onSuccess } });
  return { ...result, onClose, onSuccess };
}

async function fill(title: string, description: string) {
  await fireEvent.input(screen.getByTestId("add-course-title-input"), { target: { value: title } });
  await fireEvent.input(screen.getByTestId("add-course-description-input"), { target: { value: description } });
}

const submit = () => fireEvent.submit(screen.getByTestId("submit-add-modal-btn").closest("form")!);

describe("AddModal", () => {
  beforeEach(() => resetStores());

  it("tidak dirender saat show=false", () => {
    renderModal(false);
    expect(screen.queryByTestId("add-course-modal")).not.toBeInTheDocument();
  });

  it("memvalidasi judul dan deskripsi", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const addSpy = vi.spyOn(coursesStore, "asyncAddCourse");
    renderModal();

    await fill(" ", "x");
    await submit();
    expect(error).toHaveBeenLastCalledWith("Judul kursus tidak boleh kosong");

    await fill("Judul", " ");
    await submit();
    expect(error).toHaveBeenLastCalledWith("Deskripsi kursus tidak boleh kosong");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("menambah kursus lalu menutup modal dan memanggil onSuccess", async () => {
    const addSpy = vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(true);
    const { onClose, onSuccess } = renderModal();

    await fill(" Kursus Svelte ", " Belajar runes ");
    await submit();

    expect(addSpy).toHaveBeenCalledWith("Kursus Svelte", "Belajar runes");
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("tetap terbuka bila penambahan gagal", async () => {
    vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(false);
    const { onClose, onSuccess } = renderModal();
    await fill("Judul", "Deskripsi");
    await submit();
    await flush();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("tombol tutup/batal memanggil onClose dan status memuat ditampilkan", async () => {
    resetStores({ courses: { isCourseMutating: true } });
    const { onClose } = renderModal();
    expect(screen.getByText("Menyimpan...")).toBeInTheDocument();
    expect(screen.getByTestId("submit-add-modal-btn")).toBeDisabled();

    await fireEvent.click(screen.getByTestId("close-add-modal-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);

    resetStores();
    await flush();
    await fireEvent.click(screen.getByTestId("cancel-add-modal-btn"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
