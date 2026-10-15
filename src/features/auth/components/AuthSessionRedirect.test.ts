import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import AuthSessionRedirect from "./AuthSessionRedirect.svelte";
import { usersStore } from "../../users/states/usersStore";
import apiHelper from "../../../helpers/apiHelper";
import { flush, profileFixture, resetStores } from "../../../test-utils";

describe("AuthSessionRedirect", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
  });

  it("tidak melakukan apa pun tanpa token", async () => {
    const spy = vi.spyOn(usersStore, "asyncSetProfile");
    render(AuthSessionRedirect);
    await flush();
    expect(spy).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it("mengarahkan ke beranda bila sesi masih valid", async () => {
    apiHelper.putAccessToken("tkn");
    vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(profileFixture);
    render(AuthSessionRedirect);
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
  });

  it("tetap di halaman autentikasi bila profil tidak tersedia", async () => {
    apiHelper.putAccessToken("tkn");
    const spy = vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue(null);
    render(AuthSessionRedirect);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await flush();
    expect(goto).not.toHaveBeenCalled();
  });
});
