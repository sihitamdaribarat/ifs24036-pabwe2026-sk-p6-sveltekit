import { describe, it, expect, vi, type Mock } from "vitest";
import Swal from "sweetalert2";
import {
  showErrorDialog,
  showWarningDialog,
  showSuccessDialog,
  showConfirmDialog,
  formatDate,
} from "./toolsHelper";

const fire = Swal.fire as unknown as Mock;

describe("toolsHelper", () => {
  it.each([
    [showErrorDialog, "Terjadi Kesalahan", "error"],
    [showWarningDialog, "Peringatan", "warning"],
    [showSuccessDialog, "Tindakan Berhasil", "success"],
  ] as const)("%o menampilkan dialog dan menutupnya saat dikonfirmasi", async (fn, title, icon) => {
    fire.mockResolvedValueOnce({ isConfirmed: true });
    const result = await fn("Pesan uji");

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title, text: "Pesan uji", icon })
    );
    expect(Swal.close).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ isConfirmed: true });

    fire.mockResolvedValueOnce({ isConfirmed: false });
    await fn("Pesan uji");
    expect(Swal.close).toHaveBeenCalledTimes(1);
  });

  it("showConfirmDialog mengembalikan hasil konfirmasi", async () => {
    fire.mockResolvedValueOnce({ isConfirmed: true });
    const result = await showConfirmDialog("Yakin?");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Konfirmasi",
        text: "Yakin?",
        icon: "question",
        showCancelButton: true,
      })
    );
    expect(result.isConfirmed).toBe(true);
  });

  it("formatDate memformat tanggal atau mengembalikan tanda strip", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
    const formatted = formatDate("2024-10-06T00:40:35.000000Z");
    expect(formatted).toMatch(/2024/);
  });

  it("dialog tetap memakai Swal yang di-mock", () => {
    expect(vi.isMockFunction(Swal.fire)).toBe(true);
  });
});
