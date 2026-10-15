import apiHelper from "../../../helpers/apiHelper";
import type { ContentStatus, Course, CourseContent, CourseDetail } from "../types";

interface ApiResult<T = Record<string, unknown>> {
  status: string;
  message: string;
  data?: T;
}

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  function _url(path: string) {
    return BASE_URL + path;
  }

  function _json(method: string, body: unknown): RequestInit {
    return {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
  }

  async function _send<T>(path: string, options: RequestInit, errorMessage: string) {
    const response = await apiHelper.fetchData(_url(path), options);
    const result: ApiResult<T> = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || errorMessage);
    }
    return result;
  }

  // ===== Kursus =====

  async function postCourse(title: string, description: string) {
    const result = await _send<{ course_id: number }>(
      "/",
      _json("POST", { title, description }),
      "Gagal menambahkan kursus"
    );
    return result.data;
  }

  async function postCourseCover(courseId: number | string, cover: File) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await _send(
      `/${courseId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul kursus"
    );
    return result.message;
  }

  async function putCourse(courseId: number | string, title: string, description: string) {
    const result = await _send(
      `/${courseId}`,
      _json("PUT", { title, description }),
      "Gagal mengubah kursus"
    );
    return result.message;
  }

  async function getCourses(isMe = false): Promise<Course[]> {
    const result = await _send<{ courses: Course[] }>(
      isMe ? "/?is_me=1" : "/",
      { method: "GET" },
      "Gagal mengambil data kursus"
    );
    return result.data.courses;
  }

  async function getCourseById(courseId: number | string): Promise<CourseDetail> {
    const result = await _send<{ course: CourseDetail }>(
      `/${courseId}`,
      { method: "GET" },
      "Gagal mengambil detail kursus"
    );
    return result.data.course;
  }

  async function deleteCourse(courseId: number | string) {
    const result = await _send(`/${courseId}`, { method: "DELETE" }, "Gagal menghapus kursus");
    return result.message;
  }

  async function deleteAllCourses() {
    const result = await _send("/", { method: "DELETE" }, "Gagal menghapus semua kursus");
    return result.message;
  }

  // ===== Peserta =====

  async function postCourseStudent(courseId: number | string) {
    const result = await _send(
      `/${courseId}/students`,
      { method: "POST" },
      "Gagal mendaftar pada kursus"
    );
    return result.message;
  }

  async function deleteCourseStudent(courseId: number | string) {
    const result = await _send(
      `/${courseId}/students`,
      { method: "DELETE" },
      "Gagal keluar dari kursus"
    );
    return result.message;
  }

  async function putCourseRatings(courseId: number | string, ratings: number, comment: string) {
    if (!Number.isInteger(ratings) || ratings < 1 || ratings > 5) {
      throw new Error("Rating harus bernilai 1 sampai 5");
    }
    const result = await _send(
      `/${courseId}/students/ratings`,
      _json("PUT", { ratings, comment }),
      "Gagal mengubah rating kursus"
    );
    return result.message;
  }

  // ===== Konten =====

  async function postCourseContent(courseId: number | string, title: string, youtube: string) {
    const result = await _send<{ content_id: number }>(
      `/${courseId}/contents`,
      _json("POST", { title, youtube }),
      "Gagal menambahkan konten kursus"
    );
    return result.data;
  }

  async function putCourseContent(contentId: number | string, title: string, youtube: string) {
    const result = await _send(
      `/-/contents/${contentId}`,
      _json("PUT", { title, youtube }),
      "Gagal mengubah konten kursus"
    );
    return result.message;
  }

  async function getCourseContentById(contentId: number | string): Promise<CourseContent> {
    const result = await _send<{ course_content: CourseContent }>(
      `/-/contents/${contentId}`,
      { method: "GET" },
      "Gagal mengambil detail konten kursus"
    );
    return result.data.course_content;
  }

  async function deleteCourseContent(contentId: number | string) {
    const result = await _send(
      `/-/contents/${contentId}`,
      { method: "DELETE" },
      "Gagal menghapus konten kursus"
    );
    return result.message;
  }

  async function postCourseContentLearn(contentId: number | string, status: ContentStatus) {
    if (status !== 0 && status !== 1) {
      throw new Error("Status belajar harus bernilai 0 atau 1");
    }
    const result = await _send(
      `/-/contents/${contentId}/learns`,
      _json("POST", { status }),
      "Gagal mengubah status belajar"
    );
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postCourseStudent,
    deleteCourseStudent,
    putCourseRatings,
    postCourseContent,
    putCourseContent,
    getCourseContentById,
    deleteCourseContent,
    postCourseContentLearn,
  };
})();

export default courseApi;
