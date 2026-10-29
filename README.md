# Personal Cosmos 🪐✨

Personal Cosmos is a personal operating system and productivity universe built with React 18, React Three Fiber, and a Spring Boot Java backend. It organizes daily life, mindfulness, finances, knowledge, and focus across 7 celestial worlds within an interactive 3D solar system.

Designed local-first with offline PWA support, optional account creation enables seamless cross-device cloud sync and file storage without compromising privacy or local utility.

---

## 🌌 The 7 Celestial Worlds

1. **🌍 Earth — Daily Rhythm & Agenda**
   - Interactive calendar schedule and timeline block planner.
   - Task list with inline editing, category tagging, and undo actions.
   - Dynamic greetings attuned to the user's localized time zone.

2. **🌙 Moon — Personal Wellbeing**
   - Restful sleep tracking (hours, minutes, quality scoring, and wave visualization).
   - Daily 8-glass hydration gauge with quick-increment controls.
   - Energy rhythm slider and menstrual/fertile phase cycle tracker.

3. **🔴 Mars — Knowledge Vault & Secure Files**
   - Knowledge card repository with tags and descriptions.
   - Multipart file upload directly to the Java backend when signed in, with download and removal capabilities.
   - Local fallback storage for offline use.

4. **🪐 Saturn — Deep Work & Focus Orbit**
   - Drift-resistant timestamp focus timer with pause, resume, and desktop notifications.
   - Procedural Web Audio API ambient noise generator (no external audio assets).
   - Session completion history with daily comparison metrics and undo support.

5. **⚡ Mercury — Quick Capture & Checklists**
   - Rapid item capture with priority categorization.
   - Due date tracking with automated overdue indicator chips.
   - Instant undo toast upon item deletion.

6. **🪙 Jupiter — Financial Clarity & Budgeting**
   - Multi-currency spending tracker supporting USD, EUR, GBP, INR, JPY, and more.
   - Monthly budget threshold tracker with dynamic percentage calculation.
   - Income and expense logging with categorized filters.

7. **🌊 Neptune — Curated Bookmarks Vault**
   - Bookmarking engine with tags, folders, and real-time search.
   - Native HTML bookmarks file importer (compatible with Chrome, Safari, and Firefox bookmark exports).

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: React 18 (single-page application) with Vite 6.
- **3D Visualization**: `@react-three/fiber`, `@react-three/drei`, `three` (canvas procedural textures, ambient cosmic lighting).
- **Transitions**: GSAP 3 (staggered entrance, planetary orbital zoom).
- **Styling**: Hand-crafted CSS design system in `src/App.css` utilizing custom glassmorphism tokens and Tailwind CSS.
- **Routing**: `react-router-dom` with deep links (`/world/:planetId`) and graceful fallback.
- **Accessibility**: ARIA dialog landmarks, focus management via `focus-trap-react`, skip link navigation, keyboard navigation, and full WCAG 2.1 compliance verified by `@axe-core/playwright`.
- **PWA**: `vite-plugin-pwa` with web app manifest, offline service worker caching, and installable icons.

### Backend (Java Only)
- **Framework**: Spring Boot 3.3.5 targeting Java 21+.
- **Authentication**: Stateless JWT (`io.jsonwebtoken:jjwt`) with SHA-256 signatures, bcrypt password hashing, and user-scoped endpoints.
- **Data Storage**:
  - Development / Testing: H2 in-memory relational database.
  - Production: PostgreSQL with Flyway database schema migrations (`V1__init.sql`).
- **State Synchronization**: User-scoped generic JSON state sync engine (`/api/v1/state`) resolving concurrent writes via versioned envelopes and last-write-wins timestamps.
- **File Storage**: Secure local disk upload handler (`/api/v1/files`) supporting downloads, deletion, and size limits.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: >= 18.0.0
- **Java**: JDK 21+ (for running the Java backend)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/usernametan/nexora.git
cd nexora

# Install frontend dependencies
npm install
```

### 2. Running Locally

#### Option A: Local-First Frontend Only (Mock Mode)
The frontend functions entirely independently without a backend required:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

#### Option B: Full Stack (Frontend + Java Backend)
In terminal 1 (start Java Spring Boot API):
```bash
npm run dev:api
```
*(Listens on `http://127.0.0.1:8080`)*

In terminal 2 (start Vite dev server with `/api` proxy):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Create an account in Settings to test cloud sync and file uploads.

---

## 🧪 Testing

```bash
# Run ESLint (covers React, Vite, and Playwright tests)
npm run lint

# Run Vitest unit tests (formatters, storage migration, backups)
npm test

# Run backend Spring Boot integration tests (33 tests)
npm run test:backend

# Run Playwright End-to-End Suite (Cosmos 3D, Mobile, Routing, A11y, Sync)
npm run test:e2e

# Run E2E suite with backend integration enabled
E2E_BACKEND=1 npm run test:e2e
```

---

## 🐳 Docker Deployment

A complete production stack containing PostgreSQL 16, the Spring Boot Java API, and an Nginx SPA reverse proxy is provided via Docker Compose:

```bash
docker compose up --build -d
```

Services started:
- `web`: `http://localhost:80` (React SPA + Nginx)
- `api`: `http://localhost:8080` (Spring Boot API)
- `db`: `localhost:5432` (PostgreSQL)

---

## ☁️ Static Hosting (Vercel / Netlify)

- **Netlify**: Configured via `netlify.toml` and `public/_redirects`.
- **Vercel**: Configured via `vercel.json` with SPA route rewrites.

---

## 📄 License

MIT.
