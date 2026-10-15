import { describe, it, expect } from "vitest";
import {
  formatPercentage,
  formatRating,
  getYoutubeEmbedUrl,
  getYoutubeVideoId,
  isCourseOwner,
  isCourseStudent,
} from "./courseHelper";
import { courseFixture, profileFixture } from "../../../test-utils";

describe("courseHelper", () => {
  it("isCourseOwner membandingkan user_id kursus dengan id profil", () => {
    expect(isCourseOwner(courseFixture({ user_id: 1 }), profileFixture)).toBe(true);
    expect(isCourseOwner(courseFixture({ user_id: 2 }), profileFixture)).toBe(false);
    expect(isCourseOwner(null, profileFixture)).toBe(false);
    expect(isCourseOwner(courseFixture(), null)).toBe(false);
  });

  it("isCourseStudent memeriksa id profil di daftar students", () => {
    expect(isCourseStudent(courseFixture({ students: [5, 1] }), profileFixture)).toBe(true);
    expect(isCourseStudent(courseFixture({ students: [5] }), profileFixture)).toBe(false);
    expect(isCourseStudent(courseFixture({ students: undefined }), profileFixture)).toBe(false);
    expect(isCourseStudent(null, profileFixture)).toBe(false);
    expect(isCourseStudent(courseFixture(), null)).toBe(false);
  });

  it.each([
    ["https://youtu.be/uHyfQV0kbgo", "uHyfQV0kbgo"],
    ["https://youtu.be/uHyfQV0kbgo?si=abc", "uHyfQV0kbgo"],
    ["https://www.youtube.com/watch?v=uHyfQV0kbgo&t=10", "uHyfQV0kbgo"],
    ["https://m.youtube.com/watch?v=uHyfQV0kbgo", "uHyfQV0kbgo"],
    ["https://www.youtube.com/embed/uHyfQV0kbgo", "uHyfQV0kbgo"],
    ["https://youtube.com/shorts/uHyfQV0kbgo", "uHyfQV0kbgo"],
    ["https://www.youtube-nocookie.com/embed/uHyfQV0kbgo", "uHyfQV0kbgo"],
    ["  https://youtu.be/uHyfQV0kbgo  ", "uHyfQV0kbgo"],
  ])("getYoutubeVideoId(%s) = %s", (url, id) => {
    expect(getYoutubeVideoId(url)).toBe(id);
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["bukan url"],
    ["https://vimeo.com/123456"],
    ["https://youtu.be/"],
    ["https://www.youtube.com/watch"],
    ["https://www.youtube.com/embed"],
    ["https://www.youtube.com/channel/abc"],
    ["https://youtu.be/<script>"],
  ])("getYoutubeVideoId menolak %s", (url) => {
    expect(getYoutubeVideoId(url)).toBeNull();
  });

  it("getYoutubeEmbedUrl membentuk URL embed", () => {
    expect(getYoutubeEmbedUrl("https://youtu.be/uHyfQV0kbgo")).toBe(
      "https://www.youtube.com/embed/uHyfQV0kbgo"
    );
    expect(getYoutubeEmbedUrl("https://example.com")).toBeNull();
  });

  it("formatRating menampilkan satu desimal atau tanda strip", () => {
    expect(formatRating("4.0000")).toBe("4.0");
    expect(formatRating(3.666)).toBe("3.7");
    expect(formatRating(null)).toBe("-");
    expect(formatRating(undefined)).toBe("-");
    expect(formatRating("abc")).toBe("-");
  });

  it("formatPercentage membulatkan dan membatasi 0-100", () => {
    expect(formatPercentage("33.33")).toBe(33);
    expect(formatPercentage(150)).toBe(100);
    expect(formatPercentage(-5)).toBe(0);
    expect(formatPercentage("abc")).toBe(0);
    expect(formatPercentage(null)).toBe(0);
  });
});
