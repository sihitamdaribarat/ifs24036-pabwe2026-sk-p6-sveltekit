<script lang="ts">
  import { page } from "$app/state";
  import DetailPage from "../../../features/courses/pages/DetailPage.svelte";

  const courseId = $derived(page.params.courseId);
</script>

<svelte:head>
  <title>Detail Kursus - Delcom Courses</title>
  <meta name="description" content="Lihat detail kursus, materi pembelajaran, dan ulasan peserta di Delcom Courses." />
</svelte:head>

<DetailPage {courseId} />
