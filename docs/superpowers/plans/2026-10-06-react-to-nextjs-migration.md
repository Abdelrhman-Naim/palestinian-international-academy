# React (Vite) to Next.js 15 App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the entire Palestinian International Academy (PIA) platform from a Vite SPA to Next.js 15 App Router (`src/app/`), providing SSR and dynamic OpenGraph SEO for public pages while fully preserving rich interactive dashboards, chat, virtual lab, and canvas certificate tools.

**Architecture:** Hybrid Next.js 15 App Router architecture. Public catalog and marketing routes are Server Components with dynamic `generateMetadata()`. High-interactivity subsystems (Admin, Instructor, and Student Dashboards, Chat, and 3D Virtual Lab) are Client Components (`"use client"`) with browser-dependent modules isolated via `next/dynamic({ ssr: false })`. Shared state is preserved via standard React Context providers wrapped in a top-level client provider.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Supabase Client (`@supabase/supabase-js`), Framer Motion, Three.js, jsPDF, html2canvas.

**Spec:** [`docs/superpowers/specs/2026-10-06-nextjs-migration-design.md`](file:///c:/Users/Abood/Desktop/Project/docs/superpowers/specs/2026-10-06-nextjs-migration-design.md)

## Global Constraints

- Must maintain 100% feature and visual parity with the existing platform.
- Zero hydration errors: Any browser-only API (`window`, `localStorage`, `navigator`, `canvas`, WebGL) must only be accessed inside `useEffect`, event handlers, or inside `next/dynamic` with `ssr: false`.
- Authentication compatibility: Preserve existing Supabase auth flow and test credentials for all three user roles:
  - Admin: `admin@gmail.com` / `Admin@2005`
  - Instructor: `anym46927@gmail.com` / `123123`
  - Student: `abood12.e.m@gmail.com` / `123123`
- Build requirement: `next build` must succeed with exit code 0.

## Review Focus

1. **Browser global access during SSR:** Server pre-rendering evaluating `window` or `localStorage` on initial load (must be guarded or deferred).
2. **Next.js Link vs React Router Link:** Ensure all internal navigation uses `next/link` and `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) instead of `react-router-dom`.
3. **Tailwind CSS v4 Compatibility:** PostCSS configuration must properly resolve `@tailwindcss/postcss` for Next.js build compilation.
4. **Dynamic Metadata & OG Image Tags:** Ensure `generateMetadata` correctly handles missing course/book IDs without crashing the server.
5. **Role-Based Protection:** Ensure unauthenticated or unauthorized users are redirected without flashing protected content.

---

### Task 1: Next.js 15 Dependencies & Configuration Setup

**Files:**
- Modify: `package.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`

**Steps:**
- [ ] 1. Install Next.js 15 and PostCSS packages (`npm install next@latest @tailwindcss/postcss@latest postcss@latest`).
- [ ] 2. Update `package.json` scripts: replace `vite` with `next dev`, `vite build` with `next build`, `vite preview` with `next start`.
- [ ] 3. Create `next.config.mjs` configured with image domains (e.g. Supabase storage domain `erdogjeyqxufpsczriat.supabase.co`) and experimental options.
- [ ] 4. Create `postcss.config.mjs` to hook up `@tailwindcss/postcss`.
- [ ] 5. Port `src/index.css` to `src/app/globals.css` with `@import "tailwindcss";` and custom academy utility classes.
- [ ] 6. Run `npx next --version` to verify Next.js runtime is installed and operational.
- [ ] 7. Commit changes: `git commit -m "chore(next): configure Next.js 15, PostCSS and Tailwind v4"`.

---

### Task 2: Root Providers, Layout & Metadata Foundation

**Files:**
- Create: `src/app/providers.jsx`
- Create: `src/app/layout.jsx`
- Create: `src/app/not-found.jsx`
- Modify: `src/context/AuthContext.jsx`, `src/context/LanguageContext.jsx`, etc. (ensure `"use client"` directives)

**Steps:**
- [ ] 1. Ensure all context providers (`AuthContext`, `LanguageContext`, `CoursesContext`, `CategoriesContext`, `ToastContext`, `MaintenanceContext`) have `"use client"` at the top.
- [ ] 2. Create `src/app/providers.jsx` as a unified client wrapper combining all context providers and Toast notifications.
- [ ] 3. Create `src/app/layout.jsx` implementing standard fonts (Cairo, Tajawal), root HTML `dir="rtl"` / `lang="ar"`, viewport meta, mobile web app tags, and `<Providers>`.
- [ ] 4. Create `src/app/not-found.jsx` translating the existing `src/pages/NotFound.jsx` into the Next.js 15 404 handler.
- [ ] 5. Run a test development server check to verify root layout renders without hydration errors.
- [ ] 6. Commit changes: `git commit -m "feat(layout): implement RootLayout, Providers, and 404 handler"`.

---

### Task 3: Public Marketing & Discovery Pages (SSR & Metadata)

**Files:**
- Create: `src/app/page.jsx` (Home)
- Create: `src/app/courses/page.jsx` (Courses catalog)
- Create: `src/app/courses/[id]/page.jsx` (Course details + `generateMetadata`)
- Create: `src/app/library/page.jsx` (Library catalog)
- Create: `src/app/library/[id]/page.jsx` (Book details + `generateMetadata`)
- Create: `src/app/about/page.jsx` (About us)
- Create: `src/app/contact/page.jsx` (Contact us)
- Create: `src/app/verify-certificate/page.jsx` (Certificate verification)
- Create: `src/app/privacy/page.jsx`, `src/app/terms/page.jsx`, `src/app/support/page.jsx`, `src/app/partnerships/page.jsx`
- Modify: `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/components/CourseCard.jsx`, `src/components/BookCard.jsx` to use `next/link`.

**Steps:**
- [ ] 1. Update navigation links in `Navbar.jsx` and `Footer.jsx` from `react-router-dom` to `next/link` and `usePathname`.
- [ ] 2. Implement `src/app/page.jsx` rendering Hero, PopularCourses, Features, CloudLab, Testimonials, Projects, CTA, and Footer.
- [ ] 3. Implement `src/app/courses/page.jsx` and `src/app/courses/[id]/page.jsx` with dynamic metadata generation.
- [ ] 4. Implement `src/app/library/page.jsx` and `src/app/library/[id]/page.jsx` with dynamic book metadata.
- [ ] 5. Implement About, Contact, Partnerships, Support, Privacy, Terms, and Certificate Verification pages.
- [ ] 6. Verify all public routes render and generate correct `<title>` and `<meta>` tags.
- [ ] 7. Commit changes: `git commit -m "feat(routes): migrate public marketing and catalog pages to App Router"`.

---

### Task 4: Authentication Pages & Session Flow

**Files:**
- Create: `src/app/login/page.jsx`
- Create: `src/app/register/page.jsx`
- Create: `src/app/login-admin/page.jsx`
- Create: `src/app/forgot-password/page.jsx`

**Steps:**
- [ ] 1. Adapt `Login.jsx` to `src/app/login/page.jsx` using `"use client"` and Next.js `useRouter`.
- [ ] 2. Adapt `Register.jsx` to `src/app/register/page.jsx`.
- [ ] 3. Adapt `AdminLogin.jsx` to `src/app/login-admin/page.jsx`.
- [ ] 4. Adapt `ForgotPassword.jsx` to `src/app/forgot-password/page.jsx`.
- [ ] 5. Test logging in with `admin@gmail.com`, `anym46927@gmail.com`, and `abood12.e.m@gmail.com`.
- [ ] 6. Commit changes: `git commit -m "feat(auth): migrate login, register, and admin login pages"`.

---

### Task 5: Student Dashboard Subsystem

**Files:**
- Create: `src/app/dashboard/layout.jsx`
- Create: `src/app/dashboard/page.jsx` (Overview)
- Create: `src/app/dashboard/courses/page.jsx`
- Create: `src/app/dashboard/assignments/page.jsx`
- Create: `src/app/dashboard/certificates/page.jsx`
- Create: `src/app/dashboard/saved-books/page.jsx`
- Create: `src/app/dashboard/profile/page.jsx`

**Steps:**
- [ ] 1. Create `src/app/dashboard/layout.jsx` with role guard enforcing `userRole === 'student' || userRole === 'admin'`.
- [ ] 2. Connect Student Dashboard Shell, Sidebar, and Mobile bottom navigation.
- [ ] 3. Migrate Student Overview, My Courses, Assignments, Certificates, Saved Books, and Profile.
- [ ] 4. Verify student profile image upload, password change, and course progress display using student account `abood12.e.m@gmail.com`.
- [ ] 5. Commit changes: `git commit -m "feat(student): migrate student dashboard and sub-pages"`.

---

### Task 6: Instructor Dashboard Subsystem

**Files:**
- Create: `src/app/instructor-dashboard/layout.jsx`
- Create: `src/app/instructor-dashboard/page.jsx` (Overview)
- Create: `src/app/instructor-dashboard/my-courses/page.jsx`
- Create: `src/app/instructor-dashboard/add-course/page.jsx`
- Create: `src/app/instructor-dashboard/edit-course/[id]/page.jsx`
- Create: `src/app/instructor-dashboard/assignments/page.jsx`
- Create: `src/app/instructor-dashboard/submissions/page.jsx`
- Create: `src/app/instructor-dashboard/exams/page.jsx`
- Create: `src/app/instructor-dashboard/profile/page.jsx`

**Steps:**
- [ ] 1. Create `src/app/instructor-dashboard/layout.jsx` with role guard enforcing `userRole === 'instructor' || userRole === 'admin'`.
- [ ] 2. Migrate Instructor Overview, Course Management (Add/Edit), Assignments, and Exams.
- [ ] 3. Verify instructor profile update, course creation form, and submission evaluation with instructor account `anym46927@gmail.com`.
- [ ] 4. Commit changes: `git commit -m "feat(instructor): migrate instructor dashboard and course tools"`.

---

### Task 7: Admin Dashboard Subsystem

**Files:**
- Create: `src/app/admin-dashboard/layout.jsx`
- Create: `src/app/admin-dashboard/page.jsx` (Overview & Analytics)
- Create: `src/app/admin-dashboard/requests/page.jsx`
- Create: `src/app/admin-dashboard/instructors/page.jsx`
- Create: `src/app/admin-dashboard/users/page.jsx`
- Create: `src/app/admin-dashboard/courses/page.jsx`
- Create: `src/app/admin-dashboard/course-students/page.jsx`
- Create: `src/app/admin-dashboard/library/page.jsx`
- Create: `src/app/admin-dashboard/add-book/page.jsx`
- Create: `src/app/admin-dashboard/categories/page.jsx`
- Create: `src/app/admin-dashboard/library-categories/page.jsx`
- Create: `src/app/admin-dashboard/messages/page.jsx`
- Create: `src/app/admin-dashboard/activity-logs/page.jsx`
- Create: `src/app/admin-dashboard/settings/page.jsx`
- Create: `src/app/admin-dashboard/profile/page.jsx`

**Steps:**
- [ ] 1. Create `src/app/admin-dashboard/layout.jsx` with strict admin guard (`userRole === 'admin'`).
- [ ] 2. Migrate all 14 admin sub-pages and ensure `AdminPageShell` uses Next.js navigation.
- [ ] 3. Test category management, instructor approvals, user status toggle, and audit logs with admin account `admin@gmail.com`.
- [ ] 4. Commit changes: `git commit -m "feat(admin): migrate comprehensive admin dashboard and management tools"`.

---

### Task 8: Dynamic Client Subsystems (Chat, Virtual Lab, Certificates)

**Files:**
- Create: `src/app/chat/page.jsx`
- Create: `src/app/virtual-lab/page.jsx`
- Modify: `src/components/chat/CallModal.jsx`, `src/pages/VirtualLab.jsx`

**Steps:**
- [ ] 1. Adapt `ChatPage.jsx` into `src/app/chat/page.jsx` ensuring WebSockets and WebRTC call modals are client-only.
- [ ] 2. Wrap Three.js 3D canvas in `src/app/virtual-lab/page.jsx` using `dynamic(() => import(...), { ssr: false })`.
- [ ] 3. Verify certificate generation (`html2canvas`, `jspdf`) runs smoothly inside browser events.
- [ ] 4. Test live chat and 3D lab rendering without server-side hydration errors.
- [ ] 5. Commit changes: `git commit -m "feat(interactive): migrate live chat, WebRTC, and 3D virtual lab"`.

---

### Task 9: Production Build & Full Verification

**Files:**
- Remove/archive: `index.html`, `vite.config.js`
- Test: Full build and runtime verification

**Steps:**
- [ ] 1. Run `npm run build` (`next build`) and inspect compiler output.
- [ ] 2. Fix any remaining route, image, or dynamic import warnings until build succeeds with 0 errors.
- [ ] 3. Verify Netlify configuration (`netlify.toml` / `@netlify/plugin-nextjs`).
- [ ] 4. Run through verification checklist with test accounts (Admin, Instructor, Student).
- [ ] 5. Commit final migration: `git commit -m "chore(release): complete React to Next.js 15 App Router migration"`.
