import type { Course } from "../types";

interface Identifiable {
  id: number;
}

/** Pemilik kursus adalah pengguna yang `user_id` kursusnya sama dengan id profil. */
export function isCourseOwner(course: Course | null, profile: Identifiable | null): boolean {
  if (!course || !profile) return false;
  return Number(course.user_id) === Number(profile.id);
}

/** Peserta adalah pengguna yang id-nya tercantum pada `students`. */
export function isCourseStudent(course: Course | null, profile: Identifiable | null): boolean {
  if (!course || !profile || !Array.isArray(course.students)) return false;
  return course.students.some((studentId) => Number(studentId) === Number(profile.id));
}

/** Mengambil id video dari tautan YouTube (youtu.be, watch, embed, shorts, live). */
export function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  const segments = parsed.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = segments[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (segments[0] === "watch") {
      videoId = parsed.searchParams.get("v");
    } else if (["embed", "shorts", "live", "v"].includes(segments[0])) {
      videoId = segments[1] ?? null;
    }
  }

  return videoId && /^[\w-]{6,}$/.test(videoId) ? videoId : null;
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function formatRating(value: string | number | null | undefined): string {
  const rating = Number(value);
  return value === null || value === undefined || Number.isNaN(rating) ? "-" : rating.toFixed(1);
}

export function formatPercentage(value: string | number | null | undefined): number {
  const percentage = Number(value);
  if (Number.isNaN(percentage)) return 0;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}
