import { describe, it, expect, vi } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";
import { contentFixture, courseFixture, jsonResponse } from "../../../test-utils";

const BASE = `${DELCOM_BASEURL}/courses`;

function mockFetch(body: unknown) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue(jsonResponse(body));
}

function jsonCall(method: string, body: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

describe("courseApi", () => {
  describe("kursus", () => {
    it("postCourse mengirim title dan description (POST /courses)", async () => {
      const spy = mockFetch({ status: "success", message: "OK", data: { course_id: 9 } });
      await expect(courseApi.postCourse("Judul", "Deskripsi")).resolves.toEqual({ course_id: 9 });
      expect(spy).toHaveBeenCalledWith(
        `${BASE}/`,
        jsonCall("POST", { title: "Judul", description: "Deskripsi" })
      );
    });

    it("postCourseCover mengunggah berkas cover (POST /courses/:id/cover)", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah cover" });
      const cover = new File(["img"], "sampul.png", { type: "image/png" });
      await expect(courseApi.postCourseCover(3, cover)).resolves.toBe("Berhasil mengubah cover");

      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${BASE}/3/cover`);
      expect(options.method).toBe("POST");
      expect(((options.body as FormData).get("cover") as File).name).toBe("sampul.png");

      await courseApi.postCourseCover(3, new File(["img"], "", { type: "image/png" }));
      expect(((spy.mock.calls[1][1].body as FormData).get("cover") as File).name).toBe("cover.jpg");
    });

    it("putCourse mengubah data kursus (PUT /courses/:id)", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah data" });
      await expect(courseApi.putCourse(3, "Baru", "Desk")).resolves.toBe("Berhasil mengubah data");
      expect(spy).toHaveBeenCalledWith(`${BASE}/3`, jsonCall("PUT", { title: "Baru", description: "Desk" }));
    });

    it("getCourses membaca data.courses dan mendukung filter is_me", async () => {
      const courses = [courseFixture()];
      const spy = mockFetch({ status: "success", data: { courses } });
      await expect(courseApi.getCourses()).resolves.toEqual(courses);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/`, { method: "GET" });

      await courseApi.getCourses(true);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/?is_me=1`, { method: "GET" });
    });

    it("getCourseById membaca data.course", async () => {
      const course = courseFixture();
      const spy = mockFetch({ status: "success", data: { course } });
      await expect(courseApi.getCourseById(3)).resolves.toEqual(course);
      expect(spy).toHaveBeenCalledWith(`${BASE}/3`, { method: "GET" });
    });

    it("deleteCourse dan deleteAllCourses memakai DELETE", async () => {
      const spy = mockFetch({ status: "success", message: "Dihapus" });
      await expect(courseApi.deleteCourse(3)).resolves.toBe("Dihapus");
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/3`, { method: "DELETE" });

      await expect(courseApi.deleteAllCourses()).resolves.toBe("Dihapus");
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/`, { method: "DELETE" });
    });
  });

  describe("peserta & rating", () => {
    it("postCourseStudent dan deleteCourseStudent memakai /courses/:id/students", async () => {
      const spy = mockFetch({ status: "success", message: "OK" });
      await courseApi.postCourseStudent(3);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/3/students`, { method: "POST" });
      await courseApi.deleteCourseStudent(3);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/3/students`, { method: "DELETE" });
    });

    it("putCourseRatings mengirim rating 1-5 beserta komentar", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah ratings" });
      await expect(courseApi.putCourseRatings(3, 5, "Mantap")).resolves.toBe(
        "Berhasil mengubah ratings"
      );
      expect(spy).toHaveBeenCalledWith(
        `${BASE}/3/students/ratings`,
        jsonCall("PUT", { ratings: 5, comment: "Mantap" })
      );
    });

    it.each([0, 6, 2.5, Number.NaN])("putCourseRatings menolak nilai %s", async (value) => {
      const spy = vi.spyOn(apiHelper, "fetchData");
      await expect(courseApi.putCourseRatings(3, value, "")).rejects.toThrow(
        "Rating harus bernilai 1 sampai 5"
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("konten", () => {
    it("postCourseContent menambah konten (POST /courses/:id/contents)", async () => {
      const spy = mockFetch({ status: "success", message: "OK", data: { content_id: 1 } });
      await expect(courseApi.postCourseContent(3, "Materi", "https://youtu.be/abcdefghijk")).resolves.toEqual({
        content_id: 1,
      });
      expect(spy).toHaveBeenCalledWith(
        `${BASE}/3/contents`,
        jsonCall("POST", { title: "Materi", youtube: "https://youtu.be/abcdefghijk" })
      );
    });

    it("putCourseContent, getCourseContentById, deleteCourseContent memakai /courses/-/contents/:id", async () => {
      const content = contentFixture();
      const spy = mockFetch({ status: "success", message: "OK", data: { course_content: content } });

      await expect(courseApi.putCourseContent(4, "Baru", "https://youtu.be/x")).resolves.toBe("OK");
      expect(spy).toHaveBeenLastCalledWith(
        `${BASE}/-/contents/4`,
        jsonCall("PUT", { title: "Baru", youtube: "https://youtu.be/x" })
      );

      await expect(courseApi.getCourseContentById(4)).resolves.toEqual(content);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/-/contents/4`, { method: "GET" });

      await expect(courseApi.deleteCourseContent(4)).resolves.toBe("OK");
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/-/contents/4`, { method: "DELETE" });
    });

    it("postCourseContentLearn mengirim status 0 atau 1", async () => {
      const spy = mockFetch({ status: "success", message: "Status diperbarui" });
      await expect(courseApi.postCourseContentLearn(4, 1)).resolves.toBe("Status diperbarui");
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/-/contents/4/learns`, jsonCall("POST", { status: 1 }));
      await courseApi.postCourseContentLearn(4, 0);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/-/contents/4/learns`, jsonCall("POST", { status: 0 }));
    });

    it("postCourseContentLearn menolak status selain 0/1", async () => {
      await expect(courseApi.postCourseContentLearn(4, 2 as never)).rejects.toThrow(
        "Status belajar harus bernilai 0 atau 1"
      );
    });
  });

  it.each([
    ["postCourse", () => courseApi.postCourse("a", "b"), "Gagal menambahkan kursus"],
    ["postCourseCover", () => courseApi.postCourseCover(1, new File(["x"], "a.png")), "Gagal mengubah sampul kursus"],
    ["putCourse", () => courseApi.putCourse(1, "a", "b"), "Gagal mengubah kursus"],
    ["getCourses", () => courseApi.getCourses(), "Gagal mengambil data kursus"],
    ["getCourseById", () => courseApi.getCourseById(1), "Gagal mengambil detail kursus"],
    ["deleteCourse", () => courseApi.deleteCourse(1), "Gagal menghapus kursus"],
    ["deleteAllCourses", () => courseApi.deleteAllCourses(), "Gagal menghapus semua kursus"],
    ["postCourseStudent", () => courseApi.postCourseStudent(1), "Gagal mendaftar pada kursus"],
    ["deleteCourseStudent", () => courseApi.deleteCourseStudent(1), "Gagal keluar dari kursus"],
    ["putCourseRatings", () => courseApi.putCourseRatings(1, 3, ""), "Gagal mengubah rating kursus"],
    ["postCourseContent", () => courseApi.postCourseContent(1, "a", "b"), "Gagal menambahkan konten kursus"],
    ["putCourseContent", () => courseApi.putCourseContent(1, "a", "b"), "Gagal mengubah konten kursus"],
    ["getCourseContentById", () => courseApi.getCourseContentById(1), "Gagal mengambil detail konten kursus"],
    ["deleteCourseContent", () => courseApi.deleteCourseContent(1), "Gagal menghapus konten kursus"],
    ["postCourseContentLearn", () => courseApi.postCourseContentLearn(1, 1), "Gagal mengubah status belajar"],
  ])("%s melempar error dengan pesan server atau bawaan", async (_name, call, fallback) => {
    mockFetch({ status: "fail", message: "Data tidak valid" });
    await expect(call()).rejects.toThrow("Data tidak valid");
    mockFetch({ status: "fail" });
    await expect(call()).rejects.toThrow(fallback);
  });
});
