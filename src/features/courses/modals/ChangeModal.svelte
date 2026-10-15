<script lang="ts">
  import { PenLine, X, LoaderCircle } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import type { Course } from "../types";

  interface Props {
    show?: boolean;
    course: Course;
    onClose: () => void;
    onSuccess: () => void;
  }

  let { show = false, course, onClose, onSuccess }: Props = $props();

  let title = $state("");
  let description = $state("");

  // Isi ulang formulir dengan data terbaru setiap kali modal dibuka.
  $effect(() => {
    if (show) {
      title = course.title;
      description = course.description ?? "";
    }
  });

  async function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) {
      showErrorDialog("Judul kursus tidak boleh kosong");
      return;
    }
    if (!description.trim()) {
      showErrorDialog("Deskripsi kursus tidak boleh kosong");
      return;
    }

    const isChanged = await coursesStore.asyncChangeCourse(course.id, title.trim(), description.trim());
    if (isChanged) {
      onClose();
      onSuccess();
    }
  }
</script>

{#if show}
  <div
    data-testid="edit-course-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-course-title"
  >
    <div class="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <PenLine size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 id="edit-course-title" class="text-base font-bold text-slate-800">Ubah Data Kursus</h3>
            <p class="text-xs text-slate-500">Perbarui judul dan deskripsi kursus</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-edit-modal-btn"
          onclick={onClose}
          aria-label="Tutup"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onsubmit={handleSave} class="flex-1 flex flex-col min-h-0 bg-white" novalidate>
        <div class="p-6 md:p-8 space-y-4 overflow-y-auto">
          <div>
            <label for="edit-course-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Judul Kursus <span class="text-red-500">*</span>
            </label>
            <input
              id="edit-course-title-input"
              type="text"
              data-testid="edit-course-title-input"
              bind:value={title}
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
              required
            />
          </div>

          <div>
            <label for="edit-course-description-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Deskripsi <span class="text-red-500">*</span>
            </label>
            <textarea
              id="edit-course-description-input"
              data-testid="edit-course-description-input"
              bind:value={description}
              rows="4"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs resize-none"
              required
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <button
            type="button"
            data-testid="cancel-edit-modal-btn"
            onclick={onClose}
            disabled={$coursesStore.isCourseMutating}
            class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-edit-modal-btn"
            disabled={$coursesStore.isCourseMutating}
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md shadow-amber-600/25 transition-all disabled:opacity-60"
          >
            {#if $coursesStore.isCourseMutating}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <PenLine size={18} strokeWidth={2.5} />
              <span>Perbarui Kursus</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
