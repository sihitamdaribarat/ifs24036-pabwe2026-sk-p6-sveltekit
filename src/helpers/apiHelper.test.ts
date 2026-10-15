import { describe, it, expect, beforeEach, vi } from "vitest";
import apiHelper from "./apiHelper";

describe("apiHelper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("menyimpan, membaca, dan menghapus access token", () => {
    expect(apiHelper.getAccessToken()).toBeNull();
    apiHelper.putAccessToken("dummy-token");
    expect(apiHelper.getAccessToken()).toBe("dummy-token");
    apiHelper.putAccessToken("");
    expect(apiHelper.getAccessToken()).toBeNull();
  });

  it("menghapus slash di akhir URL dan menambahkan header Authorization bila ada token", async () => {
    apiHelper.putAccessToken("test-token");
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await apiHelper.fetchData("http://localhost:8765/api/v1/courses/", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8765/api/v1/courses",
      expect.objectContaining({
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
      })
    );
    vi.unstubAllGlobals();
  });

  it("mempertahankan query string dan tidak menambah Authorization tanpa token", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await apiHelper.fetchData("http://localhost:8765/api/v1/courses/?is_me=1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8765/api/v1/courses?is_me=1",
      expect.objectContaining({ headers: {} })
    );
    vi.unstubAllGlobals();
  });

  it("membiarkan URL tanpa slash di akhir apa adanya", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await apiHelper.fetchData("http://localhost:8765/api/v1/courses/3");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8765/api/v1/courses/3",
      expect.objectContaining({ mode: "cors" })
    );
    vi.unstubAllGlobals();
  });
});
