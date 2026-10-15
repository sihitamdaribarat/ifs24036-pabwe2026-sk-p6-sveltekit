import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import NotFoundPage from "./NotFoundPage.svelte";

describe("NotFoundPage", () => {
  it("menampilkan pesan halaman tidak ditemukan dan tautan beranda", () => {
    render(NotFoundPage);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Halaman Tidak Ditemukan")).toBeInTheDocument();
    expect(screen.getByTestId("home-button")).toHaveAttribute("href", "/");
  });

  it("tombol kembali memanggil history.back()", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(NotFoundPage);
    await fireEvent.click(screen.getByTestId("back-button"));
    expect(back).toHaveBeenCalled();
  });
});
