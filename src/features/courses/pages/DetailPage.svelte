<script lang="ts">
  import { untrack } from "svelte";
  import { goto } from "$app/navigation";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Calendar,
    Plus,
    Pencil,
    Video,
    Users,
    Star,
    Crown,
    LogIn,
    LogOut,
    Lock,
    CircleCheck,
    GraduationCap,
    LoaderCircle,
    MessageSquare,
    CircleAlert,
  } from "lucide-svelte";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog, showErrorDialog } from "../../../helpers/toolsHelper";
  import {
    formatPercentage,
    formatRating,
    isCourseOwner,
    isCourseStudent,
  } from "../utils/courseHelper";
  import type { CourseContent } from "../types";

  let { courseId }: { courseId: string } = $props();

  let notFound = $state(false);
  let showCoverModal = $state(false);
  let showEditModal = $state(false);
  let showContentModal = $state(false);
  let selectedContent = $state<CourseContent | null>(null);
  let ratingValue = $state(0);
  let ratingComment = $state("");

  const profile = $derived($usersStore.profile);
  // Abaikan detail kursus lain yang masih tersimpan dari halaman sebelumnya.
  const course = $derived(
    $coursesStore.course && String($coursesStore.course.id) === String(courseId)
      ? $coursesStore.course
      : null
  );
  const isOwner = $derived(isCourseOwner(course, profile));
  const isStudent = $derived(isCourseStudent(course, profile));
  const canLearn = $derived(isOwner || isStudent);
  const contents = $derived(course?.contents ?? []);
  const ratings = $derived(course?.ratings ?? []);
  const progress = $derived(formatPercentage(course?.my_percentage_finished));

  async function loadCourse(id: string) {
    notFound = false;
    const result = await coursesStore.asyncSetCourse(id);
    notFound = result === null;
  }

  function reload() {
    return loadCourse(courseId);
  }

  $effect(() => {
    const id = courseId;
    untrack(() => loadCourse(id));
  });

  async function handleDeleteCourse() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed && (await coursesStore.asyncDeleteCourse(courseId))) {
      await goto("/");
    }
  }

  async function handleJoin() {
    if (await coursesStore.asyncJoinCourse(courseId)) {
      await reload();
    }
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin keluar dari kursus ini?");
    if (result.isConfirmed && (await coursesStore.asyncLeaveCourse(courseId))) {
      await reload();
    }
  }

  async function handleRating(event: SubmitEvent) {
    event.preventDefault();
    if (ratingValue < 1 || ratingValue > 5) {
      showErrorDialog("Pilih rating antara 1 sampai 5 bintang");
      return;
    }
    if (await coursesStore.asyncChangeRating(courseId, ratingValue, ratingComment.trim())) {
      ratingValue = 0;
      ratingComment = "";
      await reload();
    }
  }

  function openAddContent() {
    selectedContent = null;
    showContentModal = true;
  }

  function openEditContent(content: CourseContent) {
    selectedContent = content;
    showContentModal = true;
  }

  async function handleDeleteContent(contentId: number) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus konten ini?");
    if (result.isConfirmed && (await coursesStore.asyncDeleteContent(contentId))) {
      await reload();
    }
  }
</script>

{#if notFound}
  <div data-testid="course-not-found" class="max-w-md mx-auto text-center py-20 space-y-4">
    <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
      <CircleAlert size={30} />
    </div>
    <h2 class="text-xl font-bold text-slate-800">Kursus tidak ditemukan</h2>
    <p class="text-sm text-slate-500">Kursus mungkin sudah dihapus atau Anda tidak memiliki akses.</p>
    <a href="/" class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
      <ArrowLeft size={16} /> Kembali ke Semua Kursus
    </a>
  </div>
{:else if !course}
  <div data-testid="course-loading" class="flex flex-col items-center justify-center py-20">
    <LoaderCircle size={32} class="text-indigo-600 animate-spin" />
  </div>
{:else}
  <div class="space-y-6 max-w-5xl mx-auto">
    <a
      href="/"
      data-testid="back-to-courses-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft size={18} />
      Kembali ke Semua Kursus
    </a>

    <!-- Informasi kursus -->
    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="relative w-full h-56 sm:h-72 bg-slate-900 overflow-hidden">
        {#if course.cover}
          <img data-testid="course-cover" src={course.cover} alt={course.title} class="w-full h-full object-cover" />
        {:else}
          <div data-testid="course-cover-placeholder" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-cyan-500 text-white/80">
            <GraduationCap size={72} />
          </div>
        {/if}
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{course.title}</h1>
          {#if course.author}
            <p class="text-sm text-white/80 mt-1">Oleh <strong class="text-white">{course.author.name}</strong></p>
          {/if}
        </div>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-2xl bg-indigo-50/70 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Materi</p>
            <p data-testid="stat-contents" class="text-2xl font-black text-indigo-700 mt-1">{contents.length}</p>
          </div>
          <div class="rounded-2xl bg-slate-100/80 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-700">Peserta</p>
            <p data-testid="stat-students" class="text-2xl font-black text-slate-700 mt-1">{(course.students ?? []).length}</p>
          </div>
          <div class="rounded-2xl bg-amber-50/80 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-amber-800">Rata-rata Rating</p>
            <p data-testid="stat-rating" class="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1">
              <Star size={18} /> {formatRating(course.avg_ratings)}
            </p>
          </div>
          <div class="rounded-2xl bg-emerald-50/80 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Ulasan</p>
            <p class="text-2xl font-black text-emerald-700 mt-1">{ratings.length}</p>
          </div>
        </div>

        <div data-testid="course-description" class="text-slate-600 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">
          {#if course.description}
            {course.description}
          {:else}
            <span class="italic text-slate-400">Belum ada deskripsi untuk kursus ini.</span>
          {/if}
        </div>

        <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          <span class="flex items-center gap-1.5"><Calendar size={14} /> Dibuat: <strong class="text-slate-500">{formatDate(course.created_at)}</strong></span>
          <span class="flex items-center gap-1.5"><Calendar size={14} /> Diperbarui: <strong class="text-slate-500">{formatDate(course.updated_at)}</strong></span>
        </div>
      </div>
    </section>

    <!-- Antarmuka pemilik ditampilkan lebih dulu -->
    {#if isOwner}
      <section data-testid="owner-panel" class="bg-white rounded-3xl border border-amber-200/80 shadow-xs p-6 space-y-4">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Crown size={18} />
          </div>
          <div>
            <h2 class="font-bold text-slate-900">Kelola Kursus</h2>
            <p class="text-xs text-slate-500">Anda adalah pemilik kursus ini.</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="edit-cover-btn"
            onclick={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} /> Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-course-btn"
            onclick={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} /> Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-course-btn"
            onclick={handleDeleteCourse}
            disabled={$coursesStore.isCourseMutating}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors disabled:opacity-60"
          >
            <Trash2 size={16} /> Hapus Kursus
          </button>
        </div>
      </section>
    {/if}

    <!-- Antarmuka peserta -->
    {#if isStudent}
      <section data-testid="student-panel" class="bg-white rounded-3xl border border-emerald-200/80 shadow-xs p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CircleCheck size={18} />
            </div>
            <div>
              <h2 class="font-bold text-slate-900">Anda terdaftar sebagai peserta</h2>
              <p class="text-xs text-slate-500">Pantau progres belajar dan beri rating kursus.</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="leave-course-btn"
            onclick={handleLeave}
            disabled={$coursesStore.isStudentMutating}
            class="self-start inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors disabled:opacity-60"
          >
            <LogOut size={16} /> Keluar dari Kursus
          </button>
        </div>

        <div>
          <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Progres belajar</span>
            <span data-testid="progress-label">{`${progress}%`}</span>
          </div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style:width={`${progress}%`}></div>
          </div>
        </div>

        <form data-testid="rating-form" onsubmit={handleRating} class="space-y-3 pt-4 border-t border-slate-100">
          <p class="text-sm font-semibold text-slate-700">Beri Rating (1–5)</p>
          <div class="flex items-center gap-1" role="radiogroup" aria-label="Rating kursus">
            {#each [1, 2, 3, 4, 5] as value (value)}
              <button
                type="button"
                data-testid={`rating-star-${value}`}
                role="radio"
                aria-checked={ratingValue === value}
                aria-label={`${value} bintang`}
                onclick={() => (ratingValue = value)}
                class="p-1 rounded-lg transition-colors {value <= ratingValue ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'}"
              >
                <Star size={26} class={value <= ratingValue ? "fill-amber-400" : ""} />
              </button>
            {/each}
          </div>
          <textarea
            data-testid="rating-comment-input"
            bind:value={ratingComment}
            rows="2"
            placeholder="Tulis ulasan singkat (opsional)"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
          ></textarea>
          <button
            type="submit"
            data-testid="submit-rating-btn"
            disabled={$coursesStore.isRatingMutating}
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25 transition-all disabled:opacity-60"
          >
            {#if $coursesStore.isRatingMutating}
              <LoaderCircle size={16} class="animate-spin" /> Menyimpan...
            {:else}
              <Star size={16} /> Simpan Rating
            {/if}
          </button>
        </form>
      </section>
    {:else}
      <section data-testid="join-panel" class="bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/20">
        <div>
          <h2 class="font-bold text-lg">Tertarik dengan kursus ini?</h2>
          <p class="text-sm text-white/80">Daftar sebagai peserta untuk membuka seluruh materi dan memberi rating.</p>
        </div>
        <button
          type="button"
          data-testid="join-course-btn"
          onclick={handleJoin}
          disabled={$coursesStore.isStudentMutating}
          class="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-colors disabled:opacity-60"
        >
          {#if $coursesStore.isStudentMutating}
            <LoaderCircle size={16} class="animate-spin" /> Memproses...
          {:else}
            <LogIn size={16} /> Daftar Kursus
          {/if}
        </button>
      </section>
    {/if}

    <!-- Daftar konten -->
    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Video size={18} />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">Daftar Konten</h2>
            <p class="text-xs text-slate-500">Materi video pembelajaran kursus</p>
          </div>
        </div>
        {#if isOwner}
          <button
            type="button"
            data-testid="add-content-btn"
            onclick={openAddContent}
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Konten
          </button>
        {/if}
      </div>

      {#if contents.length === 0}
        <div data-testid="empty-contents" class="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <Video size={36} class="mx-auto text-slate-300 mb-2" />
          <p class="text-sm font-semibold text-slate-600">Belum ada konten</p>
        </div>
      {:else}
        <ol class="space-y-3">
          {#each contents as content, index (content.id)}
            <li
              data-testid={`content-item-${content.id}`}
              class="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/70 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                  {index + 1}
                </div>
                <div class="min-w-0">
                  {#if canLearn}
                    <a
                      href={`/courses/${course.id}/contents/${content.id}`}
                      data-testid={`open-content-${content.id}`}
                      class="text-sm font-bold text-slate-800 hover:text-indigo-600 truncate block"
                    >
                      {content.title}
                    </a>
                  {:else}
                    <p class="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                      <Lock size={14} class="text-slate-400 shrink-0" />
                      <span>{content.title}</span>
                    </p>
                  {/if}
                  {#if isStudent}
                    {#if content.my_status_finished}
                      <span data-testid={`content-finished-${content.id}`} class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <CircleCheck size={12} /> Selesai
                      </span>
                    {:else}
                      <span class="text-[11px] font-medium text-slate-400 mt-0.5">Belum selesai</span>
                    {/if}
                  {/if}
                </div>
              </div>

              {#if isOwner}
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-testid={`edit-content-${content.id}`}
                    onclick={() => openEditContent(content)}
                    class="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Ubah Konten"
                    aria-label={`Ubah konten ${content.title}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-content-${content.id}`}
                    onclick={() => handleDeleteContent(content.id)}
                    class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Hapus Konten"
                    aria-label={`Hapus konten ${content.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <!-- Ulasan peserta -->
    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <MessageSquare size={18} />
        </div>
        <h2 class="text-lg font-bold text-slate-900">Rating & Ulasan Peserta</h2>
      </div>

      {#if ratings.length === 0}
        <p data-testid="empty-ratings" class="text-sm text-slate-600 italic">Belum ada rating untuk kursus ini.</p>
      {:else}
        <ul class="space-y-3">
          {#each ratings as rating, index (index)}
            <li data-testid="rating-item" class="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users size={14} class="text-slate-400" />
                  <span>{rating.name}</span>
                </span>
                <span class="flex items-center gap-0.5 text-amber-500" aria-label={`${rating.ratings} dari 5 bintang`}>
                  {#each [1, 2, 3, 4, 5] as value (value)}
                    <Star size={14} class={value <= rating.ratings ? "fill-amber-400" : "text-slate-300"} />
                  {/each}
                </span>
              </div>
              {#if rating.comment}
                <p class="text-sm text-slate-600 mt-2">{rating.comment}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if isOwner}
      <ChangeCoverModal show={showCoverModal} {course} onClose={() => (showCoverModal = false)} onSuccess={reload} />
      <ChangeModal show={showEditModal} {course} onClose={() => (showEditModal = false)} onSuccess={reload} />
      <ContentModal
        show={showContentModal}
        courseId={course.id}
        content={selectedContent}
        onClose={() => (showContentModal = false)}
        onSuccess={reload}
      />
    {/if}
  </div>
{/if}
