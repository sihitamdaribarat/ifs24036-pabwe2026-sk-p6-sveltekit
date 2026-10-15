import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ChangeModal from "./ChangeModal.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { courseFixture, flush, resetStores } from "../../../test-utils";

function renderModal(props: Record<string, unknown> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const result = render(ChangeModal, {
    props: { show: true, course: courseFixture(), onClose, onSuccess, ...props },
  });
  return { ...result, onClose, onSuccess };
}

const submit = () => fireEvent.submit(screen.getByTestId("submit-edit-modal-btn").closest("form")!);

describe("ChangeModal", () => {
  beforeEach(() => resetStores());

  it("tidak dirender saat show=false", () => {
    renderModal({ show: false });
    expect(screen.queryByTestId("edit-course-modal")).not.toBeInTheDocument();
  });

  it("mengisi formulir dengan data kursus saat dibuka", async () => {
    const { rerender } = renderModal({ show: false, course: courseFixture({ description: null }) });
    await rerender({ show: true });
    expect(screen.getByTestId("edit-course-title-input")).toHaveValue("Dasar C");
    expect(screen.getByTestId("edit-course-description-input")).toHaveValue("");
  });

  it("memvalidasi isian", async () => {
    const error = vi.spyOn(toolsHelper, "showErrorDialog");
    const changeSpy = vi.spyOn(coursesStore, "asyncChangeCourse");
    renderModal();

    await fireEvent.input(screen.getByTestId("edit-course-title-input"), { target: { value: " " } });
    await submit();
    expect(error).toHaveBeenLastCalledWith("Judul kursus tidak boleh kosong");

    await fireEvent.input(screen.getByTestId("edit-course-title-input"), { target: { value: "Baru" } });
    await fireEvent.input(screen.getByTestId("edit-course-description-input"), { target: { value: " " } });
    await submit();
    expect(error).toHaveBeenLastCalledWith("Deskripsi kursus tidak boleh kosong");
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("menyimpan perubahan (PUT) lalu menutup modal", async () => {
    const changeSpy = vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(true);
    const { onClose, onSuccess } = renderModal();
    await fireEvent.input(screen.getByTestId("edit-course-title-input"), { target: { value: " Dasar C++ " } });
    await submit();

    expect(changeSpy).toHaveBeenCalledWith(3, "Dasar C++", "Belajar dasar C dari awal");
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("tetap terbuka saat gagal; tombol tutup & batal memanggil onClose", async () => {
    vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(false);
    const { onClose, onSuccess } = renderModal();
    await submit();
    await flush();
    expect(onSuccess).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByTestId("close-edit-modal-btn"));
    await fireEvent.click(screen.getByTestId("cancel-edit-modal-btn"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("menampilkan status memuat", () => {
    resetStores({ courses: { isCourseMutating: true } });
    renderModal();
    expect(screen.getByText("Menyimpan...")).toBeInTheDocument();
  });
});
