# Architectural Specification: Migration from React (Vite) to Next.js 15 App Router

- **Date:** 2026-10-06
- **Status:** Approved Draft for Implementation Planning
- **Target Platform:** Next.js 15 (React 19, Tailwind CSS v4, App Router)
- **Deployment:** Netlify & Vercel compatible

---

## 1. Executive Summary

This specification outlines the architectural blueprint for migrating the **Palestinian International Academy (PIA)** web platform from a client-side Single Page Application (SPA) powered by Vite + React Router to **Next.js 15 App Router** (`src/app/`).

The migration addresses:
1. **Search Engine Optimization (SEO) & Fast First Paint:** Server-Side Rendering (SSR) and dynamic metadata generation (`generateMetadata`) for courses, books, articles, and public landing pages.
2. **Social Media Previews & Crawlers:** Instant, rich OpenGraph cards for Facebook, LinkedIn, WhatsApp, X/Twitter, and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) without client-side hydration delays.
3. **Preservation of Rich Client Features:** Seamless operation of high-interactivity subsystems (Admin, Instructor, and Student Dashboards, WebRTC live video/audio calls, chat, Three.js 3D Virtual Lab, and certificate PDF generation).

---

## 2. Technology Stack & Key Dependencies

| Layer | Existing (Vite) | Target (Next.js 15) | Rationale |
|---|---|---|---|
| **Framework** | Vite 8 + React 19 SPA | Next.js 15 App Router | Native SSR, automatic code splitting, static/dynamic hybrid rendering |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Tailwind CSS v4 (`@tailwindcss/postcss` / PostCSS) | Maintained visual design tokens and responsive classes |
| **Routing** | `react-router-dom` v7 | Next.js App Router (`next/navigation`, `next/link`) | File-based routing with layout nesting and streaming |
| **Backend / DB** | Supabase (`@supabase/supabase-js`) | Supabase (`@supabase/supabase-js`) | Unchanged database, auth, and realtime subscriptions |
| **Client State** | React Context (`Auth`, `Courses`, `Categories`, `Language`, `Toast`) | React Context (with `"use client"` wrappers) | Smooth compatibility with zero business logic regression |
| **Animations** | `framer-motion` | `framer-motion` | Preserved UI transitions in client boundaries |

---

## 3. Directory Layout & Routing Architecture

```text
src/
├── app/                                    # Next.js 15 App Router
│   ├── layout.jsx                          # Root Layout (lang, dir, font, RootProviders)
│   ├── page.jsx                            # Home Page (SSR)
│   ├── not-found.jsx                       # 404 Page
│   │
│   ├── (public)/                           # Public Marketing & Educational Routes (SSR + Metadata)
│   │   ├── courses/
│   │   │   ├── page.jsx                    # Courses Catalog with search & category filter
│   │   │   └── [id]/page.jsx               # Course Detail (generateMetadata, dynamic SSR)
│   │   ├── library/
│   │   │   ├── page.jsx                    # Digital Library Catalog
│   │   │   └── [id]/page.jsx               # Book Detail (generateMetadata, dynamic SSR)
│   │   ├── about/page.jsx                  # About Us
│   │   ├── contact/page.jsx                # Contact Us
│   │   ├── partnerships/page.jsx           # Partnerships
│   │   ├── support/page.jsx                # Support Center
│   │   ├── privacy/page.jsx                # Privacy Policy
│   │   ├── terms/page.jsx                  # Terms of Service
│   │   └── verify-certificate/page.jsx     # Certificate Verification
│   │
│   ├── (auth)/                             # Authentication Routes ("use client")
│   │   ├── login/page.jsx                  # Student / Instructor Login
│   │   ├── register/page.jsx               # Student / Instructor Registration
│   │   ├── login-admin/page.jsx            # Admin Login
│   │   └── forgot-password/page.jsx        # Password Reset
│   │
│   ├── dashboard/                          # Student Dashboard ("use client")
│   │   ├── layout.jsx                      # Student Dashboard Shell & Sidebar
│   │   ├── page.jsx                        # Student Overview
│   │   ├── courses/page.jsx                # Enrolled Courses
│   │   ├── assignments/page.jsx            # Student Assignments
│   │   ├── certificates/page.jsx           # Certificates
│   │   ├── saved-books/page.jsx            # Saved Books
│   │   └── profile/page.jsx                # Student Profile
│   │
│   ├── instructor-dashboard/               # Instructor Dashboard ("use client")
│   │   ├── layout.jsx                      # Instructor Dashboard Shell & Sidebar
│   │   ├── page.jsx                        # Instructor Overview
│   │   ├── my-courses/page.jsx             # Instructor Courses List
│   │   ├── add-course/page.jsx             # Add New Course
│   │   ├── edit-course/[id]/page.jsx       # Edit Existing Course
│   │   ├── assignments/page.jsx            # Manage Assignments
│   │   ├── submissions/page.jsx            # Submitted Student Assignments
│   │   ├── exams/page.jsx                  # Manage Course Exams
│   │   └── profile/page.jsx                # Instructor Profile
│   │
│   ├── admin-dashboard/                    # Admin Dashboard ("use client")
│   │   ├── layout.jsx                      # Admin Dashboard Shell & Sidebar
│   │   ├── page.jsx                        # Admin Overview & Analytics
│   │   ├── requests/page.jsx               # Instructor Approvals & Verification Requests
│   │   ├── instructors/page.jsx            # Instructor Accounts Management
│   │   ├── users/page.jsx                  # Users & Students Directory
│   │   ├── courses/page.jsx                # All Academy Courses
│   │   ├── course-students/page.jsx        # Enrollments & Course Students
│   │   ├── library/page.jsx                # Digital Books Library Management
│   │   ├── add-book/page.jsx               # Add New Book to Library
│   │   ├── categories/page.jsx             # Course Categories
│   │   ├── library-categories/page.jsx     # Library Categories
│   │   ├── messages/page.jsx               # Contact Messages
│   │   ├── activity-logs/page.jsx          # Security & Activity Audit Logs
│   │   ├── settings/page.jsx               # Global Platform Settings & Maintenance
│   │   └── profile/page.jsx                # Admin Profile
│   │
│   ├── chat/                               # Realtime Messaging & Audio/Video Call ("use client")
│   │   └── page.jsx
│   └── virtual-lab/                        # 3D Virtual Lab (Dynamic Import, ssr: false)
│       └── page.jsx
│
├── components/                             # Reusable UI Primitives & Sections
├── context/                                # Auth, Language, Courses, Categories, Toast
├── hooks/                                  # Custom React Hooks
├── services/                               # Chat, Notifications, Certificate, Activity Log
├── supabase/                               # Supabase client & DB schema
└── utils/                                  # Image compression, dates, sanitization, formatting
```

---

## 4. Client-Side Only Subsystems & Dynamic Import Strategy

Several modules rely on browser DOM APIs (`window`, `document`, `navigator.mediaDevices`, `canvas`, WebGL):

1. **Three.js Virtual Lab:**
   ```jsx
   const VirtualLabCanvas = dynamic(() => import('@/components/VirtualLab3D'), {
     ssr: false,
     loading: () => <PageLoader fullScreen={false} />
   });
   ```
2. **HTML2Canvas & jsPDF Certificate Generator:**
   Dynamically loaded inside client handlers or via dynamic imports so server builds never evaluate canvas APIs.
3. **WebRTC Video/Audio Call Modal:**
   Confined strictly inside client-side chat components (`"use client"`) using conditional `typeof window !== 'undefined'` guards.

---

## 5. Metadata & SEO Strategy

Every public page implements Next.js standard Metadata API:
- Static routes use `export const metadata = { ... }`.
- Dynamic routes (e.g. `/courses/[id]`, `/library/[id]`) implement `generateMetadata({ params })` to fetch course/book title, thumbnail, and description directly on the server to render rich OpenGraph tags for search engines and social cards.

---

## 6. Authentication & Route Guards

- User sessions are stored and synced through Supabase client and local storage snapshots for 0ms hydration.
- The `AuthContext` provides `currentUser`, `userRole`, `userStatus`, and role verification.
- Layout shells (`dashboard/layout.jsx`, `instructor-dashboard/layout.jsx`, `admin-dashboard/layout.jsx`) act as protective client boundaries that redirect unauthorized roles to login or unauthorized pages immediately upon hydration.

---

## 7. Verification & Acceptance Criteria

The migration is deemed complete and verified when:
1. `next build` runs with 0 errors and 0 lint warnings.
2. Public pages (Home, Courses, Library, About, Verify Certificate) render with full SSR and valid `<meta>` tags.
3. All 3 dashboards log in and function with the test accounts:
   - **Admin:** `admin@gmail.com` / `Admin@2005` -> `/admin-dashboard`
   - **Instructor:** `anym46927@gmail.com` / `123123` -> `/instructor-dashboard`
   - **Student:** `abood12.e.m@gmail.com` / `123123` -> `/dashboard`
4. Course and book details load dynamic data seamlessly.
5. Interactive features (Chat, Profile Avatar update, 3D Lab, Certificate generation) execute with zero console crashes.
