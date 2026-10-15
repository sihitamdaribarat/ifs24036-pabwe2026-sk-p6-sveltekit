<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import CourseLayout from "../features/courses/layouts/CourseLayout.svelte";
  import "../index.css";

  let { children }: { children: Snippet } = $props();

  // Rute /auth memakai layout autentikasinya sendiri; halaman galat tampil tanpa layout.
  const isAuthRoute = $derived(page.url.pathname.startsWith("/auth"));
  const isErrorPage = $derived(page.error !== null);
</script>

{#if isAuthRoute || isErrorPage}
  {@render children()}
{:else}
  <CourseLayout>
    {@render children()}
  </CourseLayout>
{/if}
