import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import UsersPage from "./UsersPage.svelte";
import { usersStore } from "../states/usersStore";
import { profileFixture, resetStores } from "../../../test-utils";

const users = [
  profileFixture,
  { id: 2, name: "Siti Aminah", email: "siti@del.ac.id", photo: "http://localhost/siti.png", created_at: null },
];

describe("UsersPage", () => {
  beforeEach(() => {
    resetStores();
  });

  it("menampilkan indikator memuat lalu daftar pengguna", async () => {
    let resolveUsers: () => void = () => {};
    vi.spyOn(usersStore, "asyncSetUsers").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUsers = () => {
            usersStore.setUsers(users);
            resolve();
          };
        })
    );

    render(UsersPage);
    expect(screen.getByText("Memuat daftar pengguna...")).toBeInTheDocument();

    resolveUsers();
    await waitFor(() => expect(screen.getByTestId("user-card-1")).toBeInTheDocument());
    expect(screen.getByTestId("user-card-2")).toBeInTheDocument();
    expect(screen.getByAltText("Siti Aminah")).toHaveAttribute("src", "http://localhost/siti.png");
    expect(screen.getByTestId("total-users")).toHaveTextContent("Total: 2 Pengguna");
  });

  it("menyaring pengguna berdasarkan nama atau email dan menampilkan status kosong", async () => {
    vi.spyOn(usersStore, "asyncSetUsers").mockImplementation(async () => {
      usersStore.setUsers(users);
    });
    render(UsersPage);
    await waitFor(() => expect(screen.getByTestId("user-card-1")).toBeInTheDocument());

    const search = screen.getByTestId("search-user-input");
    await fireEvent.input(search, { target: { value: "SITI" } });
    expect(screen.queryByTestId("user-card-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-card-2")).toBeInTheDocument();

    await fireEvent.input(search, { target: { value: "abdullah@delcom" } });
    expect(screen.getByTestId("user-card-1")).toBeInTheDocument();

    await fireEvent.input(search, { target: { value: "tidak-ada" } });
    expect(screen.getByText("Tidak ada data pengguna ditemukan.")).toBeInTheDocument();
  });
});
