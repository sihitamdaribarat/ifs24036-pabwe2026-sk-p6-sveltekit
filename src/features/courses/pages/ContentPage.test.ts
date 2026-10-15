import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import ContentPage from "./ContentPage.svelte";
import { coursesStore } from "../states/coursesStore";
import { contentFixture, courseFixture, flush, profileFixture, resetStores } from "../../../test-utils";
import type { CourseContent, CourseDetail } from "../types";

const contents = [
  contentFixture({ id: 4, title: "Pengenalan Pointer", my_status_finished: true }),
  contentFixture({ id: 5, title: "Array", my_status_finished: true }),
  contentFixture({ id: 6, title: "Struct", my_status_finished: false }),
];
const studentCourse = courseFixture({ user_id: 2, students: [1], contents });
const ownerCourse = courseFixture({ user_id: 1, students: [], contents });

function mockLoad(course: CourseDetail | null, content: CourseContent | null) {
  const courseSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {
    coursesStore.setCourse(course);
    return course;
  });
  const contentSpy = vi.spyOn(coursesStore, "asyncSetContent").mockImplementation(async () => {
    coursesStore.setContent(content);
    return content;
  });
  return { courseSpy, contentSpy };
}

async function renderContent(course: CourseDetail | null, content: CourseContent | null, contentId = "4") {
  const spies = mockLoad(course, content);
  const result = render(ContentPage, { props: { courseId: "3", contentId } });
  await waitFor(() => expect(spies.contentSpy).toHaveBeenCalled());
  await flush();
  return { ...result, ...spies };
}

describe("ContentPage", () => {
  beforeEach(() => {
    resetStores({ users: { profile: profileFixture } });
  });

  it("menampilkan indikator memuat", () => {
    vi.spyOn(coursesStore, "asyncSetCourse").mockReturnValue(new Promise(() => {}));
    vi.spyOn(coursesStore, "asyncSetContent").mockReturnValue(new Promise(() => {}));
    render(ContentPage, { props: { courseId: "3", contentId: "4" } });
    expect(screen.getByTestId("content-loading")).toBeInTheDocument();
  });

  it("menampilkan pesan bila materi tidak ditemukan", async () => {
    await renderContent(studentCourse, null);
    expect(screen.getByTestId("content-not-found")).toBeInTheDocument();
  });

  it("memutar tautan YouTube dalam iframe embed", async () => {
    const { courseSpy, contentSpy } = await renderContent(studentCourse, contents[0]);
    expect(courseSpy).toHaveBeenCalledWith("3");
    expect(contentSpy).toHaveBeenCalledWith("4");

    expect(screen.getByRole("heading", { name: "Pengenalan Pointer" })).toBeInTheDocument();
    expect(screen.getByTestId("youtube-player")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/uHyfQV0kbgo"
    );
    expect(screen.getByTestId("back-to-course-link")).toHaveTextContent("Kembali ke Dasar C");
    expect(screen.getByTestId("back-to-course-link")).toHaveAttribute("href", "/courses/3");
  });

  it("menampilkan daftar materi dengan penanda aktif dan selesai", async () => {
    await renderContent(studentCourse, contents[0]);
    expect(screen.getByTestId("content-link-4")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("content-link-5")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("content-link-6")).toHaveAttribute("href", "/courses/3/contents/6");
  });

  it("menampilkan tautan cadangan bila URL YouTube tidak valid", async () => {
    await renderContent(studentCourse, contentFixture({ youtube: "https://example.com/video" }));
    expect(screen.getByTestId("invalid-youtube")).toBeInTheDocument();
    expect(screen.getByText("Buka di YouTube")).toHaveAttribute("href", "https://example.com/video");
  });

  it("peserta menandai materi selesai (status 1) lalu memuat ulang", async () => {
    const statusSpy = vi.spyOn(coursesStore, "asyncChangeContentStatus").mockResolvedValueOnce(true);
    const { contentSpy } = await renderContent(studentCourse, contents[2], "6");

    expect(screen.getByTestId("toggle-status-btn")).toHaveTextContent("Tandai Selesai");
    await fireEvent.click(screen.getByTestId("toggle-status-btn"));
    expect(statusSpy).toHaveBeenCalledWith(6, 1);
    await waitFor(() => expect(contentSpy).toHaveBeenCalledTimes(2));

    statusSpy.mockResolvedValueOnce(false);
    await fireEvent.click(screen.getByTestId("toggle-status-btn"));
    await flush();
    expect(contentSpy).toHaveBeenCalledTimes(2);
  });

  it("peserta membatalkan status selesai (status 0)", async () => {
    const statusSpy = vi.spyOn(coursesStore, "asyncChangeContentStatus").mockResolvedValue(true);
    await renderContent(studentCourse, contents[0]);

    expect(screen.getByTestId("toggle-status-btn")).toHaveTextContent("Tandai Belum");
    await fireEvent.click(screen.getByTestId("toggle-status-btn"));
    expect(statusSpy).toHaveBeenCalledWith(4, 0);
  });

  it("menampilkan status menyimpan saat mutasi konten berjalan", async () => {
    await renderContent(studentCourse, contents[0]);
    coursesStore.reset({ course: studentCourse, content: contents[0], isContentMutating: true });
    await flush();
    expect(screen.getByTestId("toggle-status-btn")).toHaveTextContent("Menyimpan...");
  });

  it("pemilik yang bukan peserta tidak dapat mengubah status belajar", async () => {
    await renderContent(ownerCourse, contents[0]);
    expect(screen.queryByTestId("toggle-status-btn")).not.toBeInTheDocument();
    expect(screen.getByTestId("status-info")).toBeInTheDocument();
  });

  it("tetap menampilkan materi walaupun detail kursus gagal dimuat", async () => {
    await renderContent(null, contents[0]);
    expect(screen.getByTestId("back-to-course-link")).toHaveTextContent("Kembali ke Detail Kursus");
    expect(screen.queryByTestId("content-link-4")).not.toBeInTheDocument();
  });

  it("memuat ulang saat parameter contentId berubah", async () => {
    const { contentSpy, rerender } = await renderContent(studentCourse, contents[0]);
    await rerender({ courseId: "3", contentId: "5" });
    await waitFor(() => expect(contentSpy).toHaveBeenCalledWith("5"));
  });
});
