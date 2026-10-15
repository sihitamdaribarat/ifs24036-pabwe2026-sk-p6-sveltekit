import { createRawSnippet } from "svelte";
import { authStore } from "./features/auth/states/authStore";
import { usersStore, type UsersState } from "./features/users/states/usersStore";
import { coursesStore, type CoursesState } from "./features/courses/states/coursesStore";
import type { CourseContent, CourseDetail } from "./features/courses/types";
import type { User } from "./features/users/api/userApi";

/** Tiruan objek `page` dari `$app/state` yang dapat diubah oleh pengujian. */
export const mockPage = {
  url: new URL("http://localhost/"),
  params: {} as Record<string, string>,
  route: { id: "/" as string | null },
  status: 200,
  error: null as { message: string } | null,
};

export function setPage({
  pathname = "/",
  params = {},
  routeId = "/",
  status = 200,
  error = null,
}: {
  pathname?: string;
  params?: Record<string, string>;
  routeId?: string | null;
  status?: number;
  error?: { message: string } | null;
} = {}) {
  mockPage.url = new URL(`http://localhost${pathname}`);
  mockPage.params = params;
  mockPage.route = { id: routeId };
  mockPage.status = status;
  mockPage.error = error;
}

export function resetStores({
  users = {},
  courses = {},
}: { users?: Partial<UsersState>; courses?: Partial<CoursesState> } = {}) {
  authStore.reset();
  usersStore.reset(users);
  coursesStore.reset(courses);
}

/** Respons fetch tiruan yang mengembalikan body JSON. */
export function jsonResponse(body: unknown): Response {
  return { json: () => Promise.resolve(body) } as unknown as Response;
}

/** Snippet sederhana untuk mengisi prop `children` pada komponen layout. */
export function textSnippet(text: string) {
  return createRawSnippet(() => ({
    render: () => `<span data-testid="children">${text}</span>`,
  }));
}

export const profileFixture: User = {
  id: 1,
  name: "Abdullah Ubaid",
  email: "abdullah@delcom.org",
  photo: null,
  created_at: "2024-10-05T03:26:57.000000Z",
};

export function courseFixture(overrides: Partial<CourseDetail> = {}): CourseDetail {
  return {
    id: 3,
    user_id: 1,
    title: "Dasar C",
    cover: "http://localhost/cover.jpeg",
    description: "Belajar dasar C dari awal",
    created_at: "2024-10-06T00:40:35.000000Z",
    updated_at: "2024-10-06T00:40:35.000000Z",
    author: { name: "Abdullah Ubaid", photo: "http://localhost/user.png" },
    students: [],
    contents: [],
    total_contents: 0,
    ratings: [],
    avg_ratings: null,
    my_percentage_finished: "0",
    ...overrides,
  };
}

export function contentFixture(overrides: Partial<CourseContent> = {}): CourseContent {
  return {
    id: 4,
    course_id: 3,
    title: "Pengenalan Pointer",
    youtube: "https://youtu.be/uHyfQV0kbgo",
    created_at: "2024-10-06T01:03:20.000000Z",
    updated_at: "2024-10-06T01:03:20.000000Z",
    my_status_finished: false,
    ...overrides,
  };
}

/** Menunggu antrean microtask & efek Svelte selesai. */
export function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
