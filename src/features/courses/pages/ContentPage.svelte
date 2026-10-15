<script lang="ts">
  import { untrack } from "svelte";
  import {
    ArrowLeft,
    Video,
    CircleCheck,
    Circle,
    LoaderCircle,
    ExternalLink,
    CircleAlert,
    Calendar,
  } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl, isCourseStudent } from "../utils/courseHelper";

  let { courseId, contentId }: { courseId: string; contentId: string } = $props();

  let notFound = $state(false);

  const profile = $derived($usersStore.profile);
  const course = $derived(
    $coursesStore.course && String($coursesStore.course.id) === String(courseId)
      ? $coursesStore.course
      : null
  );
  const content = $derived(
    $coursesStore.content && String($coursesStore.content.id) === String(contentId)
      ? $coursesStore.content
      : null
  );
  const isStudent = $derived(isCourseStudent(course, profile));
  const contents = $derived(course?.contents ?? []);

  async function loadContent(cId: string, ctId: string) {
    notFound = false;
    const [, result] = await Promise.all([
      coursesStore.asyncSetCourse(cId),
      coursesStore.asyncSetContent(ctId),
    ]);
    notFound = result === null;
  }

  $effect(() => {
    const cId = courseId;
    const ctId = contentId;
    untrack(() => loadContent(cId, ctId));
  });

  async function handleToggleStatus() {
    const nextStatus = content.my_status_finished ? 0 : 1;
    if (await coursesStore.asyncChangeContentStatus(content.id, nextStatus)) {
      await loadContent(courseId, contentId);
    }
  }
</script>

{#if notFound}
  <div data-testid="content-not-found" class="max-w-md mx-auto text-center py-20 space-y-4">
    <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
      <CircleAlert size={30} />
    </div>
    <h2 class="text-xl font-bold text-slate-800">Materi tidak ditemukan</h2>
    <p class="text-sm text-slate-500">Materi mungkin sudah dihapus atau Anda belum terdaftar pada kursus ini.</p>
    <a href={`/courses/${courseId}`} class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
      <ArrowLeft size={16} /> Kembali ke Detail Kursus
    </a>
  </div>
{:else if !content}
  <div data-testid="content-loading" class="flex flex-col items-center justify-center py-20">
    <LoaderCircle size={32} class="text-indigo-600 animate-spin" />
  </div>
{:else}
  {@const embedUrl = getYoutubeEmbedUrl(content.youtube)}
  <div class="max-w-6xl mx-auto space-y-6">
    <a
      href={`/courses/${courseId}`}
      data-testid="back-to-course-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft size={18} />
      {`Kembali ke ${course ? course.title : "Detail Kursus"}`}
    </a>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-5">
        <div class="bg-slate-950 rounded-3xl overflow-hidden shadow-xl aspect-video">
          {#if embedUrl}
            <iframe
              data-testid="youtube-player"
              src={embedUrl}
              title={content.title}
              class="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          {:else}
            <div data-testid="invalid-youtube" class="w-full h-full flex flex-col items-center justify-center gap-3 text-white/80 p-6 text-center">
              <Video size={40} />
              <p class="text-sm">Tautan video tidak dapat diputar di sini.</p>
              <a href={content.youtube} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:underline">
                Buka di YouTube <ExternalLink size={14} />
              </a>
            </div>
          {/if}
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="space-y-1.5">
              <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
              <p class="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} /> Diperbarui {formatDate(content.updated_at)}
              </p>
            </div>

            {#if isStudent}
              <button
                type="button"
                data-testid="toggle-status-btn"
                onclick={handleToggleStatus}
                disabled={$coursesStore.isContentMutating}
                class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 {content.my_status_finished
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25'}"
              >
                {#if $coursesStore.isContentMutating}
                  <LoaderCircle size={18} class="animate-spin" /> Menyimpan...
                {:else if content.my_status_finished}
                  <CircleCheck size={18} /> Selesai — Tandai Belum
                {:else}
                  <Circle size={18} /> Tandai Selesai
                {/if}
              </button>
            {/if}
          </div>

          {#if !isStudent}
            <p data-testid="status-info" class="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
              Status belajar hanya dapat diperbarui oleh peserta kursus.
            </p>
          {/if}
        </div>
      </div>

      <aside class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 h-fit space-y-3">
        <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Video size={16} class="text-indigo-600" /> Materi Kursus
        </h2>
        <ol class="space-y-1.5">
          {#each contents as item, index (item.id)}
            {@const active = String(item.id) === String(contentId)}
            <li>
              <a
                href={`/courses/${courseId}/contents/${item.id}`}
                data-testid={`content-link-${item.id}`}
                aria-current={active ? "page" : undefined}
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors {active
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'}"
              >
                <span class="w-6 text-center text-xs font-bold opacity-70">{index + 1}</span>
                <span class="flex-1 truncate">{item.title}</span>
                {#if isStudent && item.my_status_finished}
                  <CircleCheck size={15} class={active ? "text-white" : "text-emerald-500"} />
                {/if}
              </a>
            </li>
          {/each}
        </ol>
      </aside>
    </div>
  </div>
{/if}
