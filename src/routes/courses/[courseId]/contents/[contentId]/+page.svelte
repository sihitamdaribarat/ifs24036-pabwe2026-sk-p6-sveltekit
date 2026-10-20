<script lang="ts">
  import { page } from "$app/state";
  import ContentPage from "../../../../../features/courses/pages/ContentPage.svelte";

  const courseId = $derived(page.params.courseId);
  const contentId = $derived(page.params.contentId);
</script>

<svelte:head>
  <title>Materi Kursus - Delcom Courses</title>
  <meta name="description" content="Pelajari materi video kursus di Delcom Courses." />
</svelte:head>

<ContentPage {courseId} {contentId} />
