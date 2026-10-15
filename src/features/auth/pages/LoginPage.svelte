<script lang="ts">
  import { goto } from "$app/navigation";
  import { Mail, Lock, LoaderCircle, LogIn } from "lucide-svelte";
  import { authStore } from "../states/authStore";
  import { usersStore } from "../../users/states/usersStore";
  import apiHelper from "../../../helpers/apiHelper";

  let email = $state("");
  let password = $state("");
  let loading = $state(false);

  async function onSubmitHandler(event: SubmitEvent) {
    event.preventDefault();
    loading = true;

    const isLoggedIn = await authStore.asyncSetIsAuthLogin(email, password);
    const profile = isLoggedIn ? await usersStore.asyncSetProfile() : null;
    loading = false;

    if (profile) {
      // Login berhasil dan profil tersedia: masuk ke daftar kursus.
      await goto("/");
    } else if (isLoggedIn) {
      apiHelper.putAccessToken("");
    }
  }
</script>

<form onsubmit={onSubmitHandler} class="space-y-4">
  <div>
    <label for="login-email-input" class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      Alamat Email
    </label>
    <div class="relative">
      <Mail size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="email"
        id="login-email-input"
        data-testid="login-email-input"
        bind:value={email}
        placeholder="nama@email.com"
        class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        required
      />
    </div>
  </div>

  <div>
    <label for="login-password-input" class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      Kata Sandi
    </label>
    <div class="relative">
      <Lock size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="password"
        id="login-password-input"
        data-testid="login-password-input"
        bind:value={password}
        placeholder="••••••••"
        class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        required
      />
    </div>
  </div>

  <div class="pt-2">
    <button
      type="submit"
      data-testid="login-submit-button"
      disabled={loading}
      class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
    >
      {#if loading}
        <LoaderCircle size={18} class="animate-spin" />
        <span>Sedang Masuk...</span>
      {:else}
        <LogIn size={18} strokeWidth={2.5} />
        <span>Masuk Sekarang</span>
      {/if}
    </button>
  </div>
</form>
