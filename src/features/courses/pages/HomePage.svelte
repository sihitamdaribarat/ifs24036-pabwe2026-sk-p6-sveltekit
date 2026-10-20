<script lang="ts">
  import { onMount } from "svelte";
  import {
    Plus,
    GraduationCap,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
    Video,
    Users,
    Star,
    Crown,
    BookOpenCheck,
    ArrowRight,
  } from "lucide-svelte";
  import AddModal from "../modals/AddModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import { formatRating, isCourseOwner, isCourseStudent } from "../utils/courseHelper";

  let isMine = $state(false);
  let searchQuery = $state("");
  let showAddModal = $state(false);

  const profile = $derived($usersStore.profile);
  const courses = $derived($coursesStore.courses);

  const filteredCourses = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) =>
      `${course.title} ${course.description ?? ""}`.toLowerCase().includes(query)
    );
  });

  const myCount = $derived(courses.filter((course) => isCourseOwner(course, profile)).length);
  const joinedCount = $derived(courses.filter((course) => isCourseStudent(course, profile)).length);

  function loadCourses() {
    return coursesStore.asyncSetCourses(isMine);
  }

  onMount(() => {
    loadCourses();
  });

  function changeFilter(mine: boolean) {
    if (isMine === mine) return;
    isMine = mine;
    loadCourses();
  }

  async function handleDeleteCourse(courseId: number) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed && (await coursesStore.asyncDeleteCourse(courseId))) {
      loadCourses();
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Apakah Anda yakin ingin menghapus SEMUA kursus milik Anda beserta kontennya?"
    );
    if (result.isConfirmed && (await coursesStore.asyncDeleteAllCourses())) {
      loadCourses();
    }
  }
</script>

<div class="space-y-8">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Semua Kursus</h1>
      <p class="text-sm text-slate-500 mt-1">
        Temukan kursus, ikuti materinya, atau buat kursus Anda sendiri.
      </p>
    </div>
    <div class="flex items-center gap-2.5 self-start sm:self-auto">
      <button
        type="button"
        data-testid="delete-all-btn"
        onclick={handleDeleteAll}
        disabled={$coursesStore.isCourseMutating}
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-60"
        title="Hapus semua kursus milik saya"
      >
        <Trash2 size={16} />
        <span>Hapus Semua</span>
      </button>
      <button
        type="button"
        data-testid="add-course-btn"
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Tambah Kursus</span>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Kursus</p>
        <h3 data-testid="stat-total" class="text-3xl font-black text-slate-800 mt-1">{courses.length}</h3>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <GraduationCap size={26} strokeWidth={2} />
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Milik Saya</p>
        <h3 data-testid="stat-mine" class="text-3xl font-black text-amber-600 mt-1">{myCount}</h3>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <Crown size={26} strokeWidth={2} />
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Diikuti</p>
        <h3 data-testid="stat-joined" class="text-3xl font-black text-emerald-600 mt-1">{joinedCount}</h3>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <BookOpenCheck size={26} strokeWidth={2} />
      </div>
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          data-testid="search-course-input"
          bind:value={searchQuery}
          placeholder="Cari judul atau deskripsi kursus..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Funnel size={16} /> Filter:
        </span>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="filter-all-btn"
            aria-pressed={!isMine}
            onclick={() => changeFilter(false)}
            class="px-3 py-1.5 rounded-lg transition-all {isMine ? 'hover:text-slate-900' : 'bg-white text-slate-900 shadow-xs'}"
          >
            Semua
          </button>
          <button
            type="button"
            data-testid="filter-mine-btn"
            aria-pressed={isMine}
            onclick={() => changeFilter(true)}
            class="px-3 py-1.5 rounded-lg transition-all {isMine ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Milik Saya
          </button>
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6">
      {#if $coursesStore.isCoursesLoading && filteredCourses.length === 0}
        <div class="py-16 text-center">
          <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
          <p class="font-medium text-slate-600">Memuat daftar kursus...</p>
        </div>
      {:else if filteredCourses.length === 0}
        <div data-testid="empty-courses" class="py-16 text-center text-slate-400">
          <GraduationCap size={40} class="mx-auto text-slate-300 mb-2" />
          <p class="font-medium">Belum ada kursus yang cocok.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {#each filteredCourses as course (course.id)}
            {@const owner = isCourseOwner(course, profile)}
            {@const student = isCourseStudent(course, profile)}
            <article
              data-testid={`course-card-${course.id}`}
              class="group flex flex-col rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
            >
              <div class="relative h-40 bg-slate-100 overflow-hidden">
                {#if course.cover}
                  <img src={course.cover} alt={course.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-50 text-indigo-400">
                    <GraduationCap size={48} />
                  </div>
                {/if}
                <div class="absolute top-3 left-3 flex gap-1.5">
                  {#if owner}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 shadow-sm">
                      <Crown size={12} /> Milik Saya
                    </span>
                  {/if}
                  {#if student}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white shadow-sm">
                      <BookOpenCheck size={12} /> Diikuti
                    </span>
                  {/if}
                </div>
              </div>

              <div class="flex-1 flex flex-col p-5 gap-3">
                <div>
                  <h3 class="font-bold text-slate-900 leading-snug line-clamp-2">{course.title}</h3>
                  {#if course.description}
                    <p class="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                  {/if}
                </div>

                {#if course.author}
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    {#if course.author.photo}
                      <img src={course.author.photo} alt={course.author.name} class="w-6 h-6 rounded-full object-cover border border-slate-200" />
                    {/if}
                    <span class="font-medium">{course.author.name}</span>
                  </div>
                {/if}

                <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                    <Video size={13} /> {`${course.total_contents ?? 0} Materi`}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <Users size={13} /> {`${(course.students ?? []).length} Peserta`}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                    <Star size={13} /> {formatRating(course.avg_ratings)}
                  </span>
                </div>

                <div class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`/courses/${course.id}`}
                    data-testid={`view-course-${course.id}`}
                    class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Lihat Detail <ArrowRight size={16} />
                  </a>
                  {#if owner}
                    <button
                      type="button"
                      data-testid={`delete-course-${course.id}`}
                      onclick={() => handleDeleteCourse(course.id)}
                      class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Kursus"
                      aria-label={`Hapus kursus ${course.title}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  {/if}
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <AddModal show={showAddModal} onClose={() => (showAddModal = false)} onSuccess={loadCourses} />
</div>
