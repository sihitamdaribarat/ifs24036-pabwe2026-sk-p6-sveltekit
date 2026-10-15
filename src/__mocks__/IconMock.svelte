<script lang="ts">
  // Pengganti ringan ikon lucide-svelte saat pengujian.
  let { class: className = "" }: { class?: string; [key: string]: unknown } = $props();
</script>

<span data-testid="icon" class={className}></span>
