import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/svelte";
import HomePage from "./HomePage.svelte";
import { coursesStore } from "../states/coursesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { courseFixture, flush, profileFixture, resetStores } from "../../../test-utils";
import type { Course } from "../types";

const courses: Course[] = [
  courseFixture({ id: 3, user_id: 1, title: "Dasar C", students: [1], total_contents: 3, avg_ratings: "4.0000" }),
  courseFixture({
    id: 4,
    user_id: 2,
    title: "Belajar ReactJS",
    description: null,
    cover: null,
    author: { name: "Budi", photo: null },
    students: undefined,
    total_contents: undefined,
  }),
  courseFixture({ id: 5, user_id: 2, title: "Svelte Runes", description: "Reaktivitas modern", author: null, students: [1] }),
];

function mockLoad(list: Course[] = courses) {
  return vi.spyOn(coursesStore, "asyncSetCourses").mockImplementation(async () => {
    coursesStore.setCourses(list);
  });
}

function confirm(isConfirmed: boolean) {
  return vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed } as never);
}

describe("HomePage", () => {
  beforeEach(() => {
    resetStores({ users: { profile: profileFixture } });
  });

  it("memuat semua kursus saat dibuka dan menampilkan statistik", async () => {
    const load = mockLoad();
    render(HomePage);

    expect(load).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.getByTestId("course-card-3")).toBeInTheDocument());
    expect(screen.getByText("Semua Kursus")).toBeInTheDocument();
    expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    expect(screen.getByTestId("stat-mine")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-joined")).toHaveTextContent("2");
  });

  it("menampilkan kartu kursus dengan lencana pemilik/peserta dan detail", async () => {
    mockLoad();
    render(HomePage);
    await waitFor(() => expect(screen.getByTestId("course-card-3")).toBeInTheDocument());

    const own = within(screen.getByTestId("course-card-3"));
    expect(own.getByText("Milik Saya")).toBeInTheDocument();
    expect(own.getByText("Diikuti")).toBeInTheDocument();
    expect(own.getByText("3 Materi")).toBeInTheDocument();
    expect(own.getByText("1 Peserta")).toBeInTheDocument();
    expect(own.getByText("4.0")).toBeInTheDocument();
    expect(own.getByAltText("Dasar C")).toHaveAttribute("src", "http://localhost/cover.jpeg");
    expect(own.getByAltText("Abdullah Ubaid")).toBeInTheDocument();
    expect(screen.getByTestId("view-course-3")).toHaveAttribute("href", "/courses/3");
    expect(screen.getByTestId("delete-course-3")).toBeInTheDocument();

    const other = within(screen.getByTestId("course-card-4"));
    expect(other.queryByText("Milik Saya")).not.toBeInTheDocument();
    expect(other.queryByText("Diikuti")).not.toBeInTheDocument();
    expect(other.getByText("0 Materi")).toBeInTheDocument();
    expect(other.getByText("0 Peserta")).toBeInTheDocument();
    expect(other.getByText("-")).toBeInTheDocument();
    expect(other.getByText("Budi")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-course-4")).not.toBeInTheDocument();

    const third = within(screen.getByTestId("course-card-5"));
    expect(third.getByText("Diikuti")).toBeInTheDocument();
  });

  it("menampilkan status memuat dan status kosong", async () => {
    vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue();
    resetStores({ users: { profile: profileFixture }, courses: { isCoursesLoading: true } });
    const { unmount } = render(HomePage);
    expect(screen.getByText("Memuat daftar kursus...")).toBeInTheDocument();
    unmount();

    resetStores({ users: { profile: profileFixture } });
    render(HomePage);
    expect(screen.getByTestId("empty-courses")).toBeInTheDocument();
  });

  it("mencari kursus berdasarkan judul atau deskripsi", async () => {
    mockLoad();
    render(HomePage);
    await waitFor(() => expect(screen.getByTestId("course-card-3")).toBeInTheDocument());

    const search = screen.getByTestId("search-course-input");
    await fireEvent.input(search, { target: { value: "react" } });
    expect(screen.getByTestId("course-card-4")).toBeInTheDocument();
    expect(screen.queryByTestId("course-card-3")).not.toBeInTheDocument();

    await fireEvent.input(search, { target: { value: "REAKTIVITAS" } });
    expect(screen.getByTestId("course-card-5")).toBeInTheDocument();
    expect(screen.queryByTestId("course-card-4")).not.toBeInTheDocument();

    await fireEvent.input(search, { target: { value: "tidak ada" } });
    expect(screen.getByTestId("empty-courses")).toBeInTheDocument();
  });

  it("filter Milik Saya memuat ulang dengan is_me", async () => {
    const load = mockLoad();
    render(HomePage);

    await fireEvent.click(screen.getByTestId("filter-mine-btn"));
    expect(load).toHaveBeenLastCalledWith(true);
    expect(screen.getByTestId("filter-mine-btn")).toHaveAttribute("aria-pressed", "true");

    await fireEvent.click(screen.getByTestId("filter-mine-btn"));
    expect(load).toHaveBeenCalledTimes(2);

    await fireEvent.click(screen.getByTestId("filter-all-btn"));
    expect(load).toHaveBeenLastCalledWith(false);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("menghapus kursus milik sendiri setelah konfirmasi", async () => {
    const load = mockLoad();
    const deleteSpy = vi.spyOn(coursesStore, "asyncDeleteCourse").mockResolvedValueOnce(true);
    confirm(true);
    render(HomePage);
    await waitFor(() => expect(screen.getByTestId("delete-course-3")).toBeInTheDocument());

    await fireEvent.click(screen.getByTestId("delete-course-3"));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(deleteSpy).toHaveBeenCalledWith(3);

    deleteSpy.mockResolvedValueOnce(false);
    await fireEvent.click(screen.getByTestId("delete-course-3"));
    await flush();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("tidak menghapus kursus bila konfirmasi dibatalkan", async () => {
    mockLoad();
    const deleteSpy = vi.spyOn(coursesStore, "asyncDeleteCourse");
    confirm(false);
    render(HomePage);
    await waitFor(() => expect(screen.getByTestId("delete-course-3")).toBeInTheDocument());

    await fireEvent.click(screen.getByTestId("delete-course-3"));
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("menghapus semua kursus setelah konfirmasi", async () => {
    const load = mockLoad();
    const deleteAll = vi.spyOn(coursesStore, "asyncDeleteAllCourses").mockResolvedValueOnce(true);
    const dialog = confirm(true);
    render(HomePage);

    await fireEvent.click(screen.getByTestId("delete-all-btn"));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(deleteAll).toHaveBeenCalled();

    deleteAll.mockResolvedValueOnce(false);
    await fireEvent.click(screen.getByTestId("delete-all-btn"));
    await flush();
    expect(load).toHaveBeenCalledTimes(2);

    dialog.mockResolvedValueOnce({ isConfirmed: false } as never);
    await fireEvent.click(screen.getByTestId("delete-all-btn"));
    await flush();
    expect(deleteAll).toHaveBeenCalledTimes(2);
  });

  it("membuka modal tambah dan memuat ulang setelah berhasil", async () => {
    const load = mockLoad();
    vi.spyOn(coursesStore, "asyncAddCourse").mockResolvedValue(true);
    render(HomePage);

    await fireEvent.click(screen.getByTestId("add-course-btn"));
    expect(screen.getByTestId("add-course-modal")).toBeInTheDocument();

    await fireEvent.input(screen.getByTestId("add-course-title-input"), { target: { value: "Baru" } });
    await fireEvent.input(screen.getByTestId("add-course-description-input"), { target: { value: "Desk" } });
    await fireEvent.submit(screen.getByTestId("submit-add-modal-btn").closest("form")!);

    await waitFor(() => expect(screen.queryByTestId("add-course-modal")).not.toBeInTheDocument());
    expect(load).toHaveBeenCalledTimes(2);
  });
});
