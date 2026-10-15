<script lang="ts">
  import { ImagePlus, X, LoaderCircle, Upload } from "lucide-svelte";
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

  let file = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);

  function handleClose() {
    file = null;
    previewUrl = null;
    onClose();
  }

  function handleFileChange(event: Event) {
    const selectedFile = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      showErrorDialog("Pilih file gambar (JPG/PNG)!");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      showErrorDialog("Ukuran gambar maksimal 2MB!");
      return;
    }

    file = selectedFile;
    previewUrl = URL.createObjectURL(selectedFile);
  }

  async function handleSave(event: SubmitEvent) {
    event.preventDefault();
    if (!file) {
      showErrorDialog("Silakan pilih gambar sampul baru!");
      return;
    }

    const isChanged = await coursesStore.asyncChangeCover(course.id, file);
    if (isChanged) {
      handleClose();
      onSuccess();
    }
  }
</script>

{#if show}
  <div
    data-testid="change-cover-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-cover-title"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <ImagePlus size={18} strokeWidth={2.5} />
          </div>
          <h3 id="change-cover-title" class="text-base font-bold text-slate-800">Ubah Sampul Kursus</h3>
        </div>
        <button
          type="button"
          data-testid="close-cover-modal-btn"
          onclick={handleClose}
          aria-label="Tutup"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onsubmit={handleSave} class="p-6 space-y-4" novalidate>
        <div>
          <span class="block text-sm font-semibold text-slate-700 mb-2">Pilih Gambar Sampul</span>
          <label class="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all overflow-hidden relative">
            {#if previewUrl}
              <img src={previewUrl} alt="Pratinjau sampul" class="w-full h-full object-cover" />
            {:else if course.cover}
              <img src={course.cover} alt="Sampul saat ini" class="w-full h-full object-cover" />
            {:else}
              <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div class="w-10 h-10 mb-2 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <p class="text-sm font-semibold text-slate-700">Klik untuk memilih gambar</p>
                <p class="text-xs text-slate-500 mt-1">PNG, JPG, JPEG (Maks. 2MB)</p>
              </div>
            {/if}
            <input
              type="file"
              data-testid="cover-file-input"
              accept=".jpg,.jpeg,.png"
              onchange={handleFileChange}
              class="hidden"
            />
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-cover-modal-btn"
            onclick={handleClose}
            disabled={$coursesStore.isCoverMutating}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-cover-modal-btn"
            disabled={$coursesStore.isCoverMutating}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md shadow-sky-600/25 transition-all disabled:opacity-60"
          >
            {#if $coursesStore.isCoverMutating}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Mengunggah...</span>
            {:else}
              <Upload size={18} strokeWidth={2.5} />
              <span>Unggah Sampul</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
