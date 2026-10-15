import { get, writable } from "svelte/store";
import courseApi from "../api/courseApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";
import type { ContentStatus, Course, CourseContent, CourseDetail } from "../types";

export interface CoursesState {
  /** Koleksi kursus (GET /courses). */
  courses: Course[];
  /** Detail kursus aktif (GET /courses/:id). */
  course: CourseDetail | null;
  /** Detail konten aktif (GET /courses/-/contents/:id). */
  content: CourseContent | null;
  isCoursesLoading: boolean;
  isCourseLoading: boolean;
  isContentLoading: boolean;
  /** Bendera mutasi: bernilai true selama permintaan berjalan. */
  isCourseMutating: boolean;
  isCoverMutating: boolean;
  isStudentMutating: boolean;
  isRatingMutating: boolean;
  isContentMutating: boolean;
}

type MutationFlag =
  | "isCourseMutating"
  | "isCoverMutating"
  | "isStudentMutating"
  | "isRatingMutating"
  | "isContentMutating";

function createCoursesStore() {
  const initial: CoursesState = {
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
  };

  const innerStore = writable<CoursesState>({ ...initial });

  function patch(partial: Partial<CoursesState>) {
    innerStore.update((s) => ({ ...s, ...partial }));
  }

  async function mutate(
    flag: MutationFlag,
    action: () => Promise<unknown>,
    successMessage: string
  ): Promise<boolean> {
    patch({ [flag]: true });
    try {
      const message = await action();
      showSuccessDialog(typeof message === "string" && message ? message : successMessage);
      return true;
    } catch (error) {
      showErrorDialog((error as Error).message);
      return false;
    } finally {
      patch({ [flag]: false });
    }
  }

  // ===== Pengambilan data =====

  async function asyncSetCourses(isMe = false): Promise<void> {
    patch({ isCoursesLoading: true });
    try {
      patch({ courses: await courseApi.getCourses(isMe) });
    } catch {
      patch({ courses: [] });
    } finally {
      patch({ isCoursesLoading: false });
    }
  }

  async function asyncSetCourse(courseId: number | string): Promise<CourseDetail | null> {
    patch({ isCourseLoading: true });
    try {
      const course = await courseApi.getCourseById(courseId);
      patch({ course });
      return course;
    } catch {
      patch({ course: null });
      return null;
    } finally {
      patch({ isCourseLoading: false });
    }
  }

  async function asyncSetContent(contentId: number | string): Promise<CourseContent | null> {
    patch({ isContentLoading: true });
    try {
      const content = await courseApi.getCourseContentById(contentId);
      patch({ content });
      return content;
    } catch {
      patch({ content: null });
      return null;
    } finally {
      patch({ isContentLoading: false });
    }
  }

  // ===== Mutasi kursus & sampul =====

  const asyncAddCourse = (title: string, description: string) =>
    mutate(
      "isCourseMutating",
      async () => {
        await courseApi.postCourse(title, description);
      },
      "Kursus berhasil ditambahkan!"
    );

  const asyncChangeCourse = (courseId: number | string, title: string, description: string) =>
    mutate(
      "isCourseMutating",
      () => courseApi.putCourse(courseId, title, description),
      "Kursus berhasil diperbarui!"
    );

  const asyncDeleteCourse = (courseId: number | string) =>
    mutate("isCourseMutating", () => courseApi.deleteCourse(courseId), "Kursus berhasil dihapus!");

  const asyncDeleteAllCourses = () =>
    mutate(
      "isCourseMutating",
      () => courseApi.deleteAllCourses(),
      "Semua kursus milik Anda berhasil dihapus!"
    );

  const asyncChangeCover = (courseId: number | string, cover: File) =>
    mutate(
      "isCoverMutating",
      () => courseApi.postCourseCover(courseId, cover),
      "Sampul kursus berhasil diperbarui!"
    );

  // ===== Peserta & rating =====

  const asyncJoinCourse = (courseId: number | string) =>
    mutate(
      "isStudentMutating",
      () => courseApi.postCourseStudent(courseId),
      "Berhasil mendaftar pada kursus!"
    );

  const asyncLeaveCourse = (courseId: number | string) =>
    mutate(
      "isStudentMutating",
      () => courseApi.deleteCourseStudent(courseId),
      "Berhasil keluar dari kursus!"
    );

  const asyncChangeRating = (courseId: number | string, ratings: number, comment: string) =>
    mutate(
      "isRatingMutating",
      () => courseApi.putCourseRatings(courseId, ratings, comment),
      "Rating kursus berhasil disimpan!"
    );

  // ===== Konten =====

  const asyncAddContent = (courseId: number | string, title: string, youtube: string) =>
    mutate(
      "isContentMutating",
      async () => {
        await courseApi.postCourseContent(courseId, title, youtube);
      },
      "Konten kursus berhasil ditambahkan!"
    );

  const asyncChangeContent = (contentId: number | string, title: string, youtube: string) =>
    mutate(
      "isContentMutating",
      () => courseApi.putCourseContent(contentId, title, youtube),
      "Konten kursus berhasil diperbarui!"
    );

  const asyncDeleteContent = (contentId: number | string) =>
    mutate(
      "isContentMutating",
      () => courseApi.deleteCourseContent(contentId),
      "Konten kursus berhasil dihapus!"
    );

  const asyncChangeContentStatus = (contentId: number | string, status: ContentStatus) =>
    mutate(
      "isContentMutating",
      () => courseApi.postCourseContentLearn(contentId, status),
      "Status belajar berhasil diperbarui!"
    );

  return {
    subscribe: innerStore.subscribe,
    get $state(): CoursesState {
      return get(innerStore);
    },
    reset(state: Partial<CoursesState> = {}) {
      innerStore.set({ ...initial, ...state });
    },
    setCourses: (courses: Course[]) => patch({ courses }),
    setCourse: (course: CourseDetail | null) => patch({ course }),
    setContent: (content: CourseContent | null) => patch({ content }),
    asyncSetCourses,
    asyncSetCourse,
    asyncSetContent,
    asyncAddCourse,
    asyncChangeCourse,
    asyncDeleteCourse,
    asyncDeleteAllCourses,
    asyncChangeCover,
    asyncJoinCourse,
    asyncLeaveCourse,
    asyncChangeRating,
    asyncAddContent,
    asyncChangeContent,
    asyncDeleteContent,
    asyncChangeContentStatus,
  };
}

export const coursesStore = createCoursesStore();
export default coursesStore;
