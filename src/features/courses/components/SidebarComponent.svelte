<script lang="ts">
  import { page } from "$app/state";
  import { LayoutDashboard, Users, CircleUser, ChevronRight } from "lucide-svelte";

  interface Props {
    isSidebarOpen?: boolean;
    onCloseMobile: () => void;
  }

  let { isSidebarOpen = false, onCloseMobile }: Props = $props();

  const navItems = [
    // Detail kursus & materi (/courses/...) termasuk bagian dari menu "Semua Kursus".
    { to: "/", label: "Semua Kursus", icon: LayoutDashboard, match: ["/", "/courses"] },
    { to: "/users", label: "Semua Pengguna", icon: Users, match: ["/users"] },
    { to: "/profile", label: "Profil Saya", icon: CircleUser, match: ["/profile"] },
  ];

  function isItemActive(match: string[], path: string) {
    return match.some((prefix) => (prefix === "/" ? path === "/" : path.startsWith(prefix)));
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") onCloseMobile();
  }
</script>

<div>
  {#if isSidebarOpen}
    <div
      data-testid="sidebar-backdrop"
      onclick={onCloseMobile}
      onkeydown={handleKeydown}
      role="button"
      tabindex="0"
      aria-label="Tutup Menu"
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
    ></div>
  {/if}

  <aside
    data-testid="sidebar"
    class="fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 p-4 transition-transform duration-200 ease-in-out md:translate-x-0 {isSidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <div class="flex flex-col h-full justify-between">
      <div>
        <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-600">Menu Utama</p>
        <nav class="mt-3 space-y-1">
          {#each navItems as item (item.to)}
            {@const active = isItemActive(item.match, page.url.pathname)}
            <a
              href={item.to}
              data-testid={`nav-${item.to}`}
              aria-current={active ? "page" : undefined}
              onclick={onCloseMobile}
              class="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all {active
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}"
            >
              <div class="flex items-center gap-3">
                <item.icon
                  size={20}
                  class={active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}
                />
                <span>{item.label}</span>
              </div>
              {#if active}
                <ChevronRight size={16} />
              {/if}
            </a>
          {/each}
        </nav>
      </div>

      <div class="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100/60">
        <p class="text-xs font-semibold text-indigo-900">Praktikum 6 PABWE (SvelteKit)</p>
        <p class="text-[11px] text-indigo-700/70 mt-0.5">Delcom Courses</p>
      </div>
    </div>
  </aside>
</div>
