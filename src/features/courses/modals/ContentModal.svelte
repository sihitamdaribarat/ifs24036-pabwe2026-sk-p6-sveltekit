<script lang="ts">
  import { Video, PenLine, X, LoaderCircle, Plus } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl } from "../utils/courseHelper";
  import type { CourseContent } from "../types";

  interface Props {
    show?: boolean;
    courseId: number;
    /** Konten yang diubah; `null` berarti menambah konten baru. */
    content?: CourseContent | null;
    onClose: () => void;
    onSuccess: () => void;
  }

  let { show = false, courseId, content = null, onClose, onSuccess }: Props = $props();

  let title = $state("");
  let youtube = $state("");

  const isEdit = $derived(content !== null);

  $effect(() => {
    if (show) {
      title = content ? content.title : "";
      youtube = content ? content.youtube : "";
    }
  });

  async function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (!title.trim()) {
      showErrorDialog("Judul konten tidak boleh kosong");
      return;
    }
    if (!getYoutubeEmbedUrl(youtube)) {
      showErrorDialog("Masukkan tautan YouTube yang valid");
      return;
    }

    const isSaved = content
      ? await coursesStore.asyncChangeContent(content.id, title.trim(), youtube.trim())
      : await coursesStore.asyncAddContent(courseId, title.trim(), youtube.trim());

    if (isSaved) {
      onClose();
      onSuccess();
    }
  }
</script>

{#if show}
  <div
    data-testid="content-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="content-modal-title"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center {isEdit ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}">
            {#if isEdit}
              <PenLine size={18} strokeWidth={2.5} />
            {:else}
              <Video size={18} strokeWidth={2.5} />
            {/if}
          </div>
          <h3 id="content-modal-title" class="text-base font-bold text-slate-800">
            {isEdit ? "Ubah Konten Kursus" : "Tambah Konten Kursus"}
          </h3>
        </div>
        <button
          type="button"
          data-testid="close-content-modal-btn"
          onclick={onClose}
          aria-label="Tutup"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onsubmit={handleSave} class="p-6 space-y-4" novalidate>
        <div>
          <label for="content-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Materi <span class="text-red-500">*</span>
          </label>
          <input
            id="content-title-input"
            type="text"
            data-testid="content-title-input"
            bind:value={title}
            placeholder="Contoh: Pengenalan Variabel"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            required
          />
        </div>

        <div>
          <label for="content-youtube-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Tautan YouTube <span class="text-red-500">*</span>
          </label>
          <input
            id="content-youtube-input"
            type="url"
            data-testid="content-youtube-input"
            bind:value={youtube}
            placeholder="https://youtu.be/xxxxxxxxxxx"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            required
          />
          <p class="text-xs text-slate-400 mt-1.5">Mendukung format youtu.be, youtube.com/watch, embed, dan shorts.</p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-content-modal-btn"
            onclick={onClose}
            disabled={$coursesStore.isContentMutating}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-content-modal-btn"
            disabled={$coursesStore.isContentMutating}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all disabled:opacity-60 {isEdit
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'}"
          >
            {#if $coursesStore.isContentMutating}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else if isEdit}
              <PenLine size={18} strokeWidth={2.5} />
              <span>Perbarui Konten</span>
            {:else}
              <Plus size={18} strokeWidth={2.5} />
              <span>Tambah Konten</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
