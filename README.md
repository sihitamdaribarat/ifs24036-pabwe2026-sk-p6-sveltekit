# Delcom Courses (ifs24036-pabwe2026-sk-p6-sveltekit)

Aplikasi kursus daring berbasis SvelteKit 3, Svelte 5, TypeScript, dan `adapter-bun`.
Sumber data: [Delcom Open API – Courses](https://open-api.delcom.org/docs/1.0/api-courses).

## Konfigurasi

Salin `.env.example` menjadi `.env`:

```env
VITE_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
APP_PORT=3005
```

## Perintah

```bash
bun install              # pasang dependensi
bun run dev              # pengembangan di http://localhost:3005
bun run test:coverage    # pengujian otomatis (threshold 100%)
bun run check            # pemeriksaan tipe svelte-check
bun run build            # build produksi
bun start                # jalankan hasil build
```

## Rute

| Rute | Halaman |
| --- | --- |
| `/` | Semua kursus: pencarian, filter milik saya, tambah, hapus |
| `/courses/[courseId]` | Detail kursus: sampul, ubah data, peserta, rating, daftar konten |
| `/courses/[courseId]/contents/[contentId]` | Pemutar YouTube & status selesai belajar |
| `/auth/login`, `/auth/register` | Autentikasi |
| `/users`, `/profile` | Daftar pengguna & profil |

## Struktur fitur

```
src/features/
├── auth/      api, states, layouts, pages, components/AuthSessionRedirect.svelte
├── common/    pages/NotFoundPage.svelte
├── users/     api, states, pages (UsersPage, ProfilePage)
└── courses/   api/courseApi.ts, states/coursesStore.ts, layouts/CourseLayout.svelte,
               components (Navbar, Sidebar), modals (Add, Change, ChangeCover, Content),
               pages (HomePage, DetailPage, ContentPage), utils/courseHelper.ts
```
