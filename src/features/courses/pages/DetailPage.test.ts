import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import DetailPage from "./DetailPage.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { contentFixture, courseFixture, flush, profileFixture, resetStores } from "../../../test-utils";
import type { CourseDetail } from "../types";

const contents = [
  contentFixture({ id: 10, title: "Materi Satu", my_status_finished: true }),
  contentFixture({ id: 11, title: "Materi Dua", my_status_finished: false }),
];

const ownerCourse = courseFixture({ user_id: 1, students: [], contents });
const studentCourse = courseFixture({
  user_id: 2,
  students: [1],
  contents,
  my_percentage_finished: "50.00",
  avg_ratings: "4.50",
  ratings: [
    { name: "Siti", ratings: 5, comment: "Mantap" },
    { name: "Budi", ratings: 4, comment: null },
  ],
});
const visitorCourse = courseFixture({
  user_id: 2,
  students: undefined,
  contents,
  cover: null,
  description: null,
  author: null,
});

function mockLoad(course: CourseDetail | null) {
  return vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
    coursesStore.setCourse(course);
    return course;
  });
}

function confirm(isConfirmed: boolean) {
  return vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed } as never);
}

async function renderDetail(course: CourseDetail | null, courseId = "3") {
  const load = mockLoad(course);
  const result = render(DetailPage, { props: { courseId } });
  await waitFor(() => expect(load).toHaveBeenCalled());
  await flush();
  return { ...result, load };
}

describe("DetailPage", () => {
  beforeEach(() => {
    resetStores({ users: { profile: profileFixture } });
  });

  it("menampilkan indikator memuat selama detail belum tersedia (mengabaikan detail kursus lain)", () => {
    resetStores({ users: { profile: profileFixture }, courses: { course: courseFixture({ id: 99 }) } });
    vi.spyOn(coursesStore, "asyncSetCourse").mockReturnValue(new Promise(() => {}));
    render(DetailPage, { props: { courseId: "3" } });
    expect(screen.getByTestId("course-loading")).toBeInTheDocument();
  });

  it("menampilkan pesan bila kursus tidak ditemukan", async () => {
    await renderDetail(null);
    expect(screen.getByTestId("course-not-found")).toBeInTheDocument();
  });

  it("memuat ulang saat parameter courseId berubah", async () => {
    const { load, rerender } = await renderDetail(ownerCourse);
    expect(load).toHaveBeenCalledWith("3");
    await rerender({ courseId: "7" });
    await waitFor(() => expect(load).toHaveBeenCalledWith("7"));
  });

  describe("pemilik kursus", () => {
    it("menampilkan sampul, data, panel pemilik, dan kontrol konten", async () => {
      await renderDetail(ownerCourse);

      expect(screen.getByTestId("course-cover")).toHaveAttribute("src", "http://localhost/cover.jpeg");
      expect(screen.getByRole("heading", { name: "Dasar C" })).toBeInTheDocument();
      expect(screen.getByText("Abdullah Ubaid")).toBeInTheDocument();
      expect(screen.getByTestId("course-description")).toHaveTextContent("Belajar dasar C dari awal");
      expect(screen.getByTestId("stat-contents")).toHaveTextContent("2");
      expect(screen.getByTestId("stat-students")).toHaveTextContent("0");
      expect(screen.getByTestId("stat-rating")).toHaveTextContent("-");

      expect(screen.getByTestId("owner-panel")).toBeInTheDocument();
      expect(screen.queryByTestId("student-panel")).not.toBeInTheDocument();
      expect(screen.getByTestId("join-panel")).toBeInTheDocument();
      expect(screen.getByTestId("add-content-btn")).toBeInTheDocument();
      expect(screen.getByTestId("open-content-10")).toHaveAttribute("href", "/courses/3/contents/10");
      expect(screen.getByTestId("edit-content-10")).toBeInTheDocument();
      expect(screen.queryByTestId("content-finished-10")).not.toBeInTheDocument();
      expect(screen.getByTestId("empty-ratings")).toBeInTheDocument();
    });

    it("menghapus kursus lalu kembali ke beranda", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValueOnce(true);
      const dialog = confirm(true);
      await renderDetail(ownerCourse);

      await fireEvent.click(screen.getByTestId("delete-course-btn"));
      await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
      expect(deleteSpy).toHaveBeenCalledWith("3");

      deleteSpy.mockResolvedValueOnce(false);
      await fireEvent.click(screen.getByTestId("delete-course-btn"));
      await flush();
      expect(goto).toHaveBeenCalledTimes(1);

      dialog.mockResolvedValueOnce({ isConfirmed: false } as never);
      await fireEvent.click(screen.getByTestId("delete-course-btn"));
      await flush();
      expect(deleteSpy).toHaveBeenCalledTimes(2);
    });

    it("membuka dan menutup modal sampul, ubah data, dan konten", async () => {
      await renderDetail(ownerCourse);

      await fireEvent.click(screen.getByTestId("edit-cover-btn"));
      expect(screen.getByTestId("change-cover-modal")).toBeInTheDocument();
      await fireEvent.click(screen.getByTestId("close-cover-modal-btn"));
      expect(screen.queryByTestId("change-cover-modal")).not.toBeInTheDocument();

      await fireEvent.click(screen.getByTestId("edit-course-btn"));
      expect(screen.getByTestId("edit-course-title-input")).toHaveValue("Dasar C");
      await fireEvent.click(screen.getByTestId("close-edit-modal-btn"));
      expect(screen.queryByTestId("edit-course-modal")).not.toBeInTheDocument();

      await fireEvent.click(screen.getByTestId("add-content-btn"));
      expect(screen.getByText("Tambah Konten Kursus")).toBeInTheDocument();
      await fireEvent.click(screen.getByTestId("close-content-modal-btn"));
      expect(screen.queryByTestId("content-modal")).not.toBeInTheDocument();

      await fireEvent.click(screen.getByTestId("edit-content-11"));
      expect(screen.getByTestId("content-title-input")).toHaveValue("Materi Dua");
    });

    it("memuat ulang detail setelah modal berhasil menyimpan", async () => {
      vi.spyOn(coursesStore, "asyncChangeCourse").mockResolvedValue(true);
      const { load } = await renderDetail(ownerCourse);

      await fireEvent.click(screen.getByTestId("edit-course-btn"));
      await fireEvent.submit(screen.getByTestId("submit-edit-modal-btn").closest("form")!);
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    });

    it("menambah konten lewat ContentModal lalu memuat ulang detail", async () => {
      const addSpy = vi.spyOn(coursesStore, "asyncAddContent").mockResolvedValue(true);
      const { load } = await renderDetail(ownerCourse);

      await fireEvent.click(screen.getByTestId("add-content-btn"));
      await fireEvent.input(screen.getByTestId("content-title-input"), { target: { value: "Materi Tiga" } });
      await fireEvent.input(screen.getByTestId("content-youtube-input"), {
        target: { value: "https://youtu.be/uHyfQV0kbgo" },
      });
      await fireEvent.submit(screen.getByTestId("submit-content-modal-btn").closest("form")!);

      expect(addSpy).toHaveBeenCalledWith(3, "Materi Tiga", "https://youtu.be/uHyfQV0kbgo");
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(screen.queryByTestId("content-modal")).not.toBeInTheDocument();
    });

    it("menghapus konten setelah konfirmasi", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncDeleteContent").mockResolvedValueOnce(true);
      const dialog = confirm(true);
      const { load } = await renderDetail(ownerCourse);

      await fireEvent.click(screen.getByTestId("delete-content-10"));
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(deleteSpy).toHaveBeenCalledWith(10);

      deleteSpy.mockResolvedValueOnce(false);
      await fireEvent.click(screen.getByTestId("delete-content-10"));
      await flush();
      expect(load).toHaveBeenCalledTimes(2);

      dialog.mockResolvedValueOnce({ isConfirmed: false } as never);
      await fireEvent.click(screen.getByTestId("delete-content-11"));
      await flush();
      expect(deleteSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("peserta kursus", () => {
    it("menampilkan panel peserta, progres, status konten, dan ulasan", async () => {
      await renderDetail(studentCourse);

      expect(screen.queryByTestId("owner-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("join-panel")).not.toBeInTheDocument();
      expect(screen.getByTestId("student-panel")).toBeInTheDocument();
      expect(screen.getByTestId("progress-label")).toHaveTextContent("50%");
      expect(screen.getByTestId("content-finished-10")).toBeInTheDocument();
      expect(screen.getByText("Belum selesai")).toBeInTheDocument();
      expect(screen.getByTestId("open-content-11")).toBeInTheDocument();
      expect(screen.queryByTestId("add-content-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-content-10")).not.toBeInTheDocument();
      expect(screen.getByTestId("stat-rating")).toHaveTextContent("4.5");
      expect(screen.getAllByTestId("rating-item")).toHaveLength(2);
      expect(screen.getByText("Mantap")).toBeInTheDocument();
    });

    it("keluar dari kursus setelah konfirmasi", async () => {
      const leaveSpy = vi.spyOn(coursesStore, "asyncLeaveCourse").mockResolvedValueOnce(true);
      const dialog = confirm(true);
      const { load } = await renderDetail(studentCourse);

      await fireEvent.click(screen.getByTestId("leave-course-btn"));
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(leaveSpy).toHaveBeenCalledWith("3");

      leaveSpy.mockResolvedValueOnce(false);
      await fireEvent.click(screen.getByTestId("leave-course-btn"));
      await flush();
      expect(load).toHaveBeenCalledTimes(2);

      dialog.mockResolvedValueOnce({ isConfirmed: false } as never);
      await fireEvent.click(screen.getByTestId("leave-course-btn"));
      await flush();
      expect(leaveSpy).toHaveBeenCalledTimes(2);
    });

    it("memvalidasi dan menyimpan rating 1-5", async () => {
      const error = vi.spyOn(toolsHelper, "showErrorDialog");
      const ratingSpy = vi.spyOn(coursesStore, "asyncChangeRating").mockResolvedValueOnce(false);
      const { load } = await renderDetail(studentCourse);
      const form = screen.getByTestId("rating-form");

      await fireEvent.submit(form);
      expect(error).toHaveBeenCalledWith("Pilih rating antara 1 sampai 5 bintang");
      expect(ratingSpy).not.toHaveBeenCalled();

      await fireEvent.click(screen.getByTestId("rating-star-4"));
      expect(screen.getByTestId("rating-star-4")).toHaveAttribute("aria-checked", "true");
      await fireEvent.input(screen.getByTestId("rating-comment-input"), { target: { value: " Bagus " } });

      await fireEvent.submit(form);
      expect(ratingSpy).toHaveBeenCalledWith("3", 4, "Bagus");
      await flush();
      expect(screen.getByTestId("rating-comment-input")).toHaveValue(" Bagus ");

      ratingSpy.mockResolvedValueOnce(true);
      await fireEvent.submit(form);
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(screen.getByTestId("rating-comment-input")).toHaveValue("");
      expect(screen.getByTestId("rating-star-4")).toHaveAttribute("aria-checked", "false");
    });

    it("menampilkan status menyimpan rating", async () => {
      await renderDetail(studentCourse);
      coursesStore.reset({ course: studentCourse, isRatingMutating: true });
      await flush();
      expect(screen.getByTestId("submit-rating-btn")).toHaveTextContent("Menyimpan...");
    });
  });

  describe("pengunjung", () => {
    it("menampilkan ajakan daftar dan konten terkunci", async () => {
      await renderDetail(visitorCourse);

      expect(screen.getByTestId("course-cover-placeholder")).toBeInTheDocument();
      expect(screen.getByText("Belum ada deskripsi untuk kursus ini.")).toBeInTheDocument();
      expect(screen.getByTestId("stat-students")).toHaveTextContent("0");
      expect(screen.getByTestId("join-panel")).toBeInTheDocument();
      expect(screen.queryByTestId("open-content-10")).not.toBeInTheDocument();
      expect(screen.getByText("Materi Satu")).toBeInTheDocument();
    });

    it("mendaftar kursus lalu memuat ulang detail", async () => {
      const joinSpy = vi.spyOn(coursesStore, "asyncJoinCourse").mockResolvedValueOnce(true);
      const { load } = await renderDetail(visitorCourse);

      await fireEvent.click(screen.getByTestId("join-course-btn"));
      await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
      expect(joinSpy).toHaveBeenCalledWith("3");

      joinSpy.mockResolvedValueOnce(false);
      await fireEvent.click(screen.getByTestId("join-course-btn"));
      await flush();
      expect(load).toHaveBeenCalledTimes(2);
    });

    it("menampilkan status memproses pendaftaran dan daftar konten kosong", async () => {
      await renderDetail(courseFixture({ user_id: 2, contents: undefined, ratings: undefined }));
      expect(screen.getByTestId("empty-contents")).toBeInTheDocument();
      expect(screen.getByTestId("empty-ratings")).toBeInTheDocument();

      coursesStore.reset({ course: courseFixture({ user_id: 2 }), isStudentMutating: true });
      await flush();
      expect(screen.getByTestId("join-course-btn")).toHaveTextContent("Memproses...");
    });
  });

  it("menampilkan antarmuka pemilik lebih dulu bila pengguna juga peserta", async () => {
    await renderDetail(courseFixture({ user_id: 1, students: [1], contents }));
    const owner = screen.getByTestId("owner-panel");
    const student = screen.getByTestId("student-panel");
    expect(owner.compareDocumentPosition(student) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("content-finished-10")).toBeInTheDocument();
    expect(screen.getByTestId("edit-content-10")).toBeInTheDocument();
  });
});
