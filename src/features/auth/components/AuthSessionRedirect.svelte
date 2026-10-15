<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { usersStore } from "../../users/states/usersStore";
  import apiHelper from "../../../helpers/apiHelper";

  // Pengguna yang masih memiliki sesi aktif tidak perlu login ulang.
  async function checkSession() {
    if (!apiHelper.getAccessToken()) return;
    const profile = await usersStore.asyncSetProfile();
    if (profile) {
      await goto("/");
    }
  }

  onMount(() => {
    checkSession();
  });
</script>
