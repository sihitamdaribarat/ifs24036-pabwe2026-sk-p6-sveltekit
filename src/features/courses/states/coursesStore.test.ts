import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { coursesStore } from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { contentFixture, courseFixture } from "../../../test-utils";

describe("coursesStore", () => {
  beforeEach(() => {
    coursesStore.reset();
  });

  it("menyimpan koleksi, detail, konten, dan bendera mutasi", () => {
    expect(coursesStore.$state).toEqual({
      courses: [],
      course: null,
      content: null,
      isCoursesLoading: false,
      isCourseLoading: false,
      isContentLoading: false,
      isCourseMutating: false,
      isCoverMutating: false,
      isStudentMutating: false,
      isRatingMutating: false,
      isContentMutating: false,
    });

    const course = courseFixture();
    const content = contentFixture();
    coursesStore.setCourses([course]);
    coursesStore.setCourse(course);
    coursesStore.setContent(content);
    expect(get(coursesStore)).toMatchObject({ courses: [course], course, content });

    coursesStore.reset({ isCourseMutating: true });
    expect(coursesStore.$state.isCourseMutating).toBe(true);
    expect(coursesStore.$state.courses).toEqual([]);
  });

  describe("pengambilan data", () => {
    it("asyncSetCourses memuat koleksi dengan filter dan mengatur bendera loading", async () => {
      const courses = [courseFixture()];
      const spy = vi.spyOn(courseApi, "getCourses").mockImplementation(async () => {
        expect(coursesStore.$state.isCoursesLoading).toBe(true);
        return courses;
      });

      await coursesStore.asyncSetCourses(true);
      expect(spy).toHaveBeenCalledWith(true);
      expect(coursesStore.$state.courses).toEqual(courses);
      expect(coursesStore.$state.isCoursesLoading).toBe(false);

      await coursesStore.asyncSetCourses();
      expect(spy).toHaveBeenLastCalledWith(false);

      spy.mockRejectedValueOnce(new Error("x"));
      await coursesStore.asyncSetCourses();
      expect(coursesStore.$state.courses).toEqual([]);
    });

    it("asyncSetCourse mengembalikan detail atau null", async () => {
      const course = courseFixture();
      vi.spyOn(courseApi, "getCourseById").mockResolvedValueOnce(course);
      await expect(coursesStore.asyncSetCourse(3)).resolves.toEqual(course);
      expect(coursesStore.$state.course).toEqual(course);

      vi.spyOn(courseApi, "getCourseById").mockRejectedValueOnce(new Error("x"));
      await expect(coursesStore.asyncSetCourse(3)).resolves.toBeNull();
      expect(coursesStore.$state.course).toBeNull();
      expect(coursesStore.$state.isCourseLoading).toBe(false);
    });

    it("asyncSetContent mengembalikan konten atau null", async () => {
      const content = contentFixture();
      vi.spyOn(courseApi, "getCourseContentById").mockResolvedValueOnce(content);
      await expect(coursesStore.asyncSetContent(4)).resolves.toEqual(content);
      expect(coursesStore.$state.content).toEqual(content);

      vi.spyOn(courseApi, "getCourseContentById").mockRejectedValueOnce(new Error("x"));
      await expect(coursesStore.asyncSetContent(4)).resolves.toBeNull();
      expect(coursesStore.$state.content).toBeNull();
      expect(coursesStore.$state.isContentLoading).toBe(false);
    });
  });

  describe("mutasi", () => {
    const file = new File(["x"], "c.png", { type: "image/png" });

    const cases = [
      ["asyncAddCourse", "postCourse", "isCourseMutating", () => coursesStore.asyncAddCourse("a", "b"), ["a", "b"], "Kursus berhasil ditambahkan!"],
      ["asyncChangeCourse", "putCourse", "isCourseMutating", () => coursesStore.asyncChangeCourse(3, "a", "b"), [3, "a", "b"], "Kursus berhasil diperbarui!"],
      ["asyncDeleteCourse", "deleteCourse", "isCourseMutating", () => coursesStore.asyncDeleteCourse(3), [3], "Kursus berhasil dihapus!"],
      ["asyncDeleteAllCourses", "deleteAllCourses", "isCourseMutating", () => coursesStore.asyncDeleteAllCourses(), [], "Semua kursus milik Anda berhasil dihapus!"],
      ["asyncChangeCover", "postCourseCover", "isCoverMutating", () => coursesStore.asyncChangeCover(3, file), [3, file], "Sampul kursus berhasil diperbarui!"],
      ["asyncJoinCourse", "postCourseStudent", "isStudentMutating", () => coursesStore.asyncJoinCourse(3), [3], "Berhasil mendaftar pada kursus!"],
      ["asyncLeaveCourse", "deleteCourseStudent", "isStudentMutating", () => coursesStore.asyncLeaveCourse(3), [3], "Berhasil keluar dari kursus!"],
      ["asyncChangeRating", "putCourseRatings", "isRatingMutating", () => coursesStore.asyncChangeRating(3, 4, "ok"), [3, 4, "ok"], "Rating kursus berhasil disimpan!"],
      ["asyncAddContent", "postCourseContent", "isContentMutating", () => coursesStore.asyncAddContent(3, "a", "y"), [3, "a", "y"], "Konten kursus berhasil ditambahkan!"],
      ["asyncChangeContent", "putCourseContent", "isContentMutating", () => coursesStore.asyncChangeContent(4, "a", "y"), [4, "a", "y"], "Konten kursus berhasil diperbarui!"],
      ["asyncDeleteContent", "deleteCourseContent", "isContentMutating", () => coursesStore.asyncDeleteContent(4), [4], "Konten kursus berhasil dihapus!"],
      ["asyncChangeContentStatus", "postCourseContentLearn", "isContentMutating", () => coursesStore.asyncChangeContentStatus(4, 1), [4, 1], "Status belajar berhasil diperbarui!"],
    ] as const;

    it.each(cases)(
      "%s memanggil %s, mengatur %s, dan menampilkan pesan",
      async (_name, apiName, flag, action, args, fallback) => {
        const success = vi.spyOn(toolsHelper, "showSuccessDialog");
        const error = vi.spyOn(toolsHelper, "showErrorDialog");
        const apiSpy = vi.spyOn(courseApi as Record<string, (...a: unknown[]) => unknown>, apiName);
        apiSpy.mockImplementation(async () => {
          expect(coursesStore.$state[flag]).toBe(true);
          return undefined;
        });

        await expect(action()).resolves.toBe(true);
        expect(apiSpy).toHaveBeenCalledWith(...args);
        expect(success).toHaveBeenLastCalledWith(fallback);
        expect(coursesStore.$state[flag]).toBe(false);

        apiSpy.mockRejectedValueOnce(new Error("Gagal server"));
        await expect(action()).resolves.toBe(false);
        expect(error).toHaveBeenCalledWith("Gagal server");
        expect(coursesStore.$state[flag]).toBe(false);
      }
    );

    it("memakai pesan dari server bila tersedia", async () => {
      const success = vi.spyOn(toolsHelper, "showSuccessDialog");
      vi.spyOn(courseApi, "putCourse").mockResolvedValueOnce("Berhasil mengubah data");
      await coursesStore.asyncChangeCourse(3, "a", "b");
      expect(success).toHaveBeenCalledWith("Berhasil mengubah data");
    });
  });
});
