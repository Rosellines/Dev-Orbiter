# EmberBoard 🔥

> **Code has a face. Let it glow.**
>
> **Kode punya wajah. Biarkan ia menyala.**

EmberBoard is a motion-rich, neumorphic developer profile wall inspired by the contribution loop of Dev_Profiles. Contributors add a small JSON profile instead of editing the UI, while the project build pipeline validates, normalizes, and enriches public GitHub metadata.

EmberBoard adalah wall profil developer bergaya neumorphic dengan motion-rich interaction. Contributor cukup menambahkan satu file JSON tanpa perlu mengubah HTML. Pipeline build akan memvalidasi, menormalisasi, dan memperkaya data menggunakan metadata GitHub publik.

---

## Table of Contents / Daftar Isi

- [English](#english)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Requirements](#requirements)
  - [Run Locally](#run-locally)
  - [Project Structure](#project-structure)
  - [Add a Contributor](#add-a-contributor)
  - [Profile Schema](#profile-schema)
  - [Validation and Build](#validation-and-build)
  - [GitHub Metadata Enrichment](#github-metadata-enrichment)
  - [Deployment to GitHub Pages](#deployment-to-github-pages)
  - [Pull Request Workflow](#pull-request-workflow)
  - [Customization](#customization)
  - [Accessibility and Motion](#accessibility-and-motion)
  - [Security Notes](#security-notes)
  - [Troubleshooting](#troubleshooting)
  - [Development Checklist](#development-checklist)
- [Bahasa Indonesia](#bahasa-indonesia)
  - [Fitur](#fitur)
  - [Arsitektur](#arsitektur)
  - [Requirement](#requirement)
  - [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
  - [Struktur Project](#struktur-project)
  - [Menambahkan Contributor](#menambahkan-contributor)
  - [Schema Profile](#schema-profile)
  - [Validasi dan Build](#validasi-dan-build)
  - [Enrichment GitHub](#enrichment-github)
  - [Deploy ke GitHub Pages](#deploy-ke-github-pages)
  - [Workflow Pull Request](#workflow-pull-request)
  - [Kustomisasi](#kustomisasi)
  - [Accessibility dan Motion](#accessibility-dan-motion)
  - [Catatan Security](#catatan-security)
  - [Troubleshooting](#troubleshooting-1)
  - [Checklist Development](#checklist-development)
- [License](#license)

---

# English

## Features

### Profile-first architecture

Every contributor is represented by a small JSON file under `data/profiles/`.

```text
data/profiles/<github-handle>.json
```

The UI does not need to be edited when a new contributor joins.

### Automatic profile manifest

`scripts/build-data.mjs` reads the contributor profile files, validates their structure, applies safe defaults, determines `joinedAt` when Git history is available, and generates:

```text
data/profiles.json
data/community.json
```

These generated files are deployment artifacts. Contributors should normally edit the source profile file, not the generated manifest.

### GitHub metadata enrichment

`scripts/enrich-github.mjs` can enrich the generated profiles with public GitHub information such as:

- Avatar
- GitHub URL
- Display name
- Followers
- Public repository count
- Approximate repository-star total
- Top languages
- Recent public activity
- Activity streak
- Public activity matrix
- Contribution Aura
- Illustrative rarity tier

The activity data is based on public GitHub API/event data and should not be interpreted as a complete private contribution history.

### Motion-rich UI

The frontend includes:

- Light/dark theme
- Neumorphic cards
- Tilt interaction
- Magnetic CTA behavior
- Pressable controls
- Cursor glow
- Scroll progress
- Search and filtering
- Profile modals
- Activity visualization
- Live merge/profile feed
- Responsive layouts
- Reduced-motion support

### Contributor ordering

The home page displays the **6 newest contributors**. Profiles are ordered by `joinedAt`, newest first.

The full contributor directory is available on `contributors.html`.

### GitHub Pages ready

The project is a static frontend. GitHub Actions can build the generated data and deploy the static site to GitHub Pages.

---

## Architecture

The project separates **source profile data**, **generated data**, **build scripts**, and **frontend presentation**.

```text
Contributor JSON
      │
      ▼
 scripts/build-data.mjs
      │
      ├── validation
      ├── defaults
      ├── joinedAt
      └── generated manifests
              │
              ├── data/profiles.json
              └── data/community.json
                       │
                       ▼
              scripts/enrich-github.mjs
                       │
                       ▼
              Static frontend
              ├── index.html
              ├── contributors.html
              ├── app.js
              ├── contributors.js
              └── styles.css
                       │
                       ▼
                 GitHub Pages
```

### Important rule

Do not add contributors directly to `data/profiles.json`.

Use:

```text
data/profiles/<your-github-handle>.json
```

The generated manifest will be rebuilt automatically.

---

## Requirements

### Required

- Git
- Node.js 20 or newer is recommended because the GitHub Actions workflows use Node 20.
- npm

Check your installation:

```bash
node --version
npm --version
git --version
```

### Optional

For local development, use a static HTTP server. This is preferable to opening `index.html` directly with `file://`.

---

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

Replace the URL with your repository URL.

### 2. Install dependencies

The current frontend intentionally has no runtime framework dependency. You can therefore preview it with a static server.

A convenient option is:

```bash
npx serve .
```

Then open the URL printed by the server.

### 3. Generate the profile manifest

Before testing profile data changes, run:

```bash
npm run validate
```

This executes:

```bash
node scripts/build-data.mjs
```

### 4. Build and enrich

To run the complete data pipeline:

```bash
npm run build
```

Equivalent commands:

```bash
npm run build:base
npm run enrich
```

### Why use a server?

Do not rely on:

```text
file:///...
```

The application reads JSON resources and other assets. A local HTTP server provides a closer approximation of the GitHub Pages runtime environment.

---

## Project Structure

The important project structure is:

```text
.
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── validate.yml
│
├── assets/
│   └── ...
│
├── data/
│   ├── profiles/
│   │   ├── _TEMPLATE.json
│   │   └── <contributor>.json
│   ├── profiles.json
│   ├── community.json
│   └── site.json
│
├── scripts/
│   ├── build-data.mjs
│   ├── enrich-github.mjs
│   └── validator.mjs
│
├── index.html
├── contributors.html
├── 404.html
├── app.js
├── contributors.js
├── styles.css
├── profiles.schema.json
├── CONTRIBUTING.md
├── package.json
└── README.md
```

### Source vs generated files

| Path | Purpose | Edit directly? |
|---|---|---:|
| `data/profiles/*.json` | Contributor source data | ✅ Yes |
| `data/profiles/_TEMPLATE.json` | New profile template | Only when maintaining the template |
| `data/profiles.json` | Generated profile manifest | ❌ No |
| `data/community.json` | Generated community data | ❌ No |
| `data/site.json` | Site metadata | Only when intentionally changing site metadata |
| `scripts/build-data.mjs` | Profile build pipeline | Only for maintainers |
| `scripts/enrich-github.mjs` | GitHub enrichment | Only for maintainers |
| `index.html` | Homepage structure | Maintainers |
| `contributors.html` | Directory structure | Maintainers |
| `app.js` | Homepage behavior | Maintainers |
| `contributors.js` | Directory behavior | Maintainers |
| `styles.css` | Visual system | Maintainers/designers |
| `profiles.schema.json` | Profile contract | Maintainers |

---

## Add a Contributor

This is the main contribution tutorial.

### Step 1 — Fork

Fork the repository to your GitHub account.

### Step 2 — Create a branch

```bash
git checkout -b add-your-github-handle
```

### Step 3 — Copy the template

Copy:

```text
data/profiles/_TEMPLATE.json
```

to:

```text
data/profiles/your-github-handle.json
```

The filename should normally match the GitHub handle.

### Step 4 — Fill the profile

Minimum profile:

```json
{
  "github": "your-github-handle",
  "bio": "A short description of what you build or care about.",
  "skills": [
    "JavaScript",
    "Open Source",
    "Your Skill"
  ]
}
```

A richer profile can look like:

```json
{
  "name": "Your Name",
  "github": "your-github-handle",
  "role": "Frontend Engineer",
  "avatar": "https://github.com/your-github-handle.png?size=160",
  "bio": "I build fast interfaces and open-source developer tools.",
  "skills": [
    "JavaScript",
    "TypeScript",
    "React",
    "CSS",
    "Open Source"
  ],
  "building": "A component library",
  "links": {
    "GitHub": "https://github.com/your-github-handle",
    "LinkedIn": "https://www.linkedin.com/in/your-github-handle/"
  },
  "projects": [
    {
      "name": "My Project",
      "url": "https://github.com/your-github-handle/my-project",
      "kind": "Project"
    }
  ]
}
```

### Step 5 — Validate

Run:

```bash
npm run validate
```

If validation succeeds, the generated manifest should be updated locally.

### Step 6 — Inspect the result

Start a local server:

```bash
npx serve .
```

Open the homepage and contributor directory.

### Step 7 — Commit

```bash
git add data/profiles/your-github-handle.json data/profiles.json data/community.json
git commit -m "feat: add your-github-handle profile"
```

### Step 8 — Push

```bash
git push origin add-your-github-handle
```

### Step 9 — Open a Pull Request

Create a Pull Request against `main`.

The validation workflow will check the profile.

### Step 10 — Merge

After review and merge, the deployment workflow rebuilds the generated data and publishes the updated wall.

---

## Profile Schema

The canonical schema is stored in:

```text
profiles.schema.json
```

The profile template is:

```text
data/profiles/_TEMPLATE.json
```

### Recommended fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name |
| `github` | string | GitHub username/handle |
| `role` | string | Role or professional description |
| `avatar` | string | Optional avatar URL |
| `bio` | string | Short profile description |
| `skills` | array | Skills/technologies |
| `building` | string | What you are currently building |
| `links` | object | Additional external links |
| `projects` | array | Selected projects |

### Skills

Keep skills concise. A practical range is **1–12 skills**.

Good:

```json
"skills": ["JavaScript", "React", "UI/UX", "Open Source"]
```

Avoid huge paragraphs inside a skill value.

### Projects

Example:

```json
"projects": [
  {
    "name": "EmberBoard",
    "url": "https://github.com/YOUR-USERNAME/YOUR-REPOSITORY",
    "kind": "Open Source"
  }
]
```

Use valid public URLs when possible.

---

## Validation and Build

### `npm run validate`

Runs the base profile build:

```bash
node scripts/build-data.mjs
```

Use it when you want to validate profile input and regenerate the base manifest.

### `npm run build:base`

Alias for the base build step:

```bash
node scripts/build-data.mjs
```

### `npm run enrich`

Runs:

```bash
node scripts/enrich-github.mjs
```

This enriches generated profile data with public GitHub information.

### `npm run build`

Runs the complete pipeline:

```bash
node scripts/build-data.mjs && node scripts/enrich-github.mjs
```

For a full deployment-style build, this is the preferred command.

---

## GitHub Metadata Enrichment

The enrichment process uses public GitHub API data.

Depending on the available API response and repository configuration, the project can derive information such as:

- Profile avatar
- GitHub profile URL
- Display name
- Followers
- Public repositories
- Repository stars
- Top languages
- Recent public events
- Activity pulse
- Activity streak
- Public activity matrix
- Contribution Aura
- Illustrative rarity

### Important limitation

Public GitHub events are **not equivalent to complete contribution history**.

Private contributions and information outside the public event/API window cannot be inferred reliably from this system.

Therefore:

> Contribution Aura and rarity are visual/illustrative metrics, not a ranking of developer value.

### GitHub token

The GitHub Actions deployment workflow exposes:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This is used by the CI environment rather than requiring contributors to publish a personal token inside profile JSON.

Never put a personal GitHub token in:

- `data/profiles/*.json`
- `index.html`
- `app.js`
- `styles.css`
- commits
- Pull Requests
- README examples

---

## Deployment to GitHub Pages

The repository includes:

```text
.github/workflows/deploy.yml
```

### Step 1 — Push the repository

Push the project to GitHub.

### Step 2 — Enable GitHub Pages

Open:

```text
Repository → Settings → Pages
```

Choose GitHub Actions as the deployment source.

### Step 3 — Confirm workflow permissions

The deployment workflow requests:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

These permissions are used to build and deploy the Pages artifact.

### Step 4 — Push to `main`

The deployment workflow runs when relevant project paths change on `main`.

### Deployment process

The workflow roughly performs:

```text
Checkout repository
      ↓
Setup Node 20
      ↓
npm run build
      ↓
Create _site
      ↓
Copy frontend + generated data
      ↓
Upload Pages artifact
      ↓
Deploy to GitHub Pages
```

---

## Pull Request Workflow

The validation workflow lives at:

```text
.github/workflows/validate.yml
```

It runs for Pull Requests that modify:

```text
data/profiles/**
profiles.schema.json
scripts/**
package.json
```

The workflow installs Node 20 and runs:

```bash
npm run validate
```

### Recommended contributor flow

```text
Fork
  ↓
Branch
  ↓
Add profile JSON
  ↓
npm run validate
  ↓
Review local result
  ↓
Commit
  ↓
Push
  ↓
Pull Request
  ↓
CI validation
  ↓
Review
  ↓
Merge
  ↓
GitHub Pages deployment
```

---

## Customization

### Visual system

The primary visual system lives in:

```text
styles.css
```

This includes:

- Theme variables
- Typography
- Neumorphic surfaces
- Accent colors
- Shadows
- Cards
- Buttons
- Responsive breakpoints
- Motion
- Reduced-motion behavior

### Homepage structure

The main page is:

```text
index.html
```

### Homepage behavior

Interaction logic lives in:

```text
app.js
```

### Contributor directory

Structure:

```text
contributors.html
```

Behavior:

```text
contributors.js
```

### Important customization rule

If you are only adding yourself as a contributor, **do not edit the UI files**.

Add your profile JSON instead.

---

## Accessibility and Motion

EmberBoard uses motion heavily, but the UI should remain usable without animation.

The project supports:

```css
@media (prefers-reduced-motion: reduce)
```

Users who disable motion at the operating-system/browser level should receive reduced animation behavior.

### Keyboard access

Interactive elements should remain reachable with keyboard navigation.

When adding new UI:

- Preserve semantic HTML.
- Keep links as links.
- Keep buttons as buttons.
- Provide visible focus states.
- Do not make hover the only way to access functionality.
- Respect reduced-motion preferences.

---

## Security Notes

### Do not trust contributor input blindly

Contributor JSON is external input from the perspective of the frontend. The build pipeline should validate it before deployment.

### Do not commit secrets

Never commit:

```text
GitHub personal access tokens
API keys
Private credentials
Session tokens
Passwords
```

### External resources

If you add an external resource, consider:

- HTTPS
- Content Security Policy compatibility
- Privacy implications
- Supply-chain risk
- Dependency stability
- Subresource Integrity where appropriate

### Generated files

Generated files should not become a manual source of truth.

If generated output looks wrong, investigate the build script or source profile rather than manually patching the generated result.

---

## Troubleshooting

### `npm run validate` fails

Run:

```bash
npm run validate
```

Read the first validation error carefully.

Common causes:

- Invalid JSON syntax
- Missing `github`
- Missing `bio`
- Invalid `skills` structure
- Unsupported field shape
- Malformed URLs

### JSON says `Unexpected token`

Check for:

- Missing comma
- Extra comma
- Missing quotation mark
- Unclosed `{}`
- Unclosed `[]`

Use a JSON-aware editor.

### Profile does not appear

Check:

1. File exists under `data/profiles/`.
2. Filename uses the GitHub handle.
3. `github` matches the intended GitHub username.
4. `npm run validate` succeeds.
5. `data/profiles.json` contains the profile after generation.
6. The browser is loading the latest generated data.

### Profile appears on the directory but not the homepage

This can be expected.

The homepage intentionally shows only the **6 newest profiles**.

Use:

```text
contributors.html
```

for the complete directory.

### GitHub metadata is missing

Possible causes:

- GitHub API response limitations
- Rate limits
- Temporary API failure
- Username mismatch
- Public data unavailable
- Enrichment was not executed

Try:

```bash
npm run build
```

### Local JSON does not load

Do not open the page directly as:

```text
file://...
```

Use:

```bash
npx serve .
```

or another static HTTP server.

### GitHub Pages deploy fails

Check:

1. Repository Pages is configured for GitHub Actions.
2. Workflow permissions are allowed.
3. The `main` branch receives the push.
4. `npm run build` succeeds in Actions.
5. The Pages artifact step completes.
6. The deployment job has permission to publish Pages.

---

## Development Checklist

Before opening a Pull Request:

```text
[ ] Profile JSON is valid
[ ] github matches the GitHub account
[ ] Bio is concise
[ ] Skills are clean and relevant
[ ] Links are valid
[ ] npm run validate passes
[ ] Local preview checked
[ ] Mobile layout checked
[ ] Dark/light themes checked
[ ] Keyboard navigation checked
[ ] Reduced motion checked
[ ] No secrets committed
[ ] No generated files manually corrupted
```

For UI changes:

```text
[ ] Desktop checked
[ ] Mobile checked
[ ] Hover checked
[ ] Focus checked
[ ] Touch behavior checked
[ ] Reduced-motion checked
[ ] Console errors checked
[ ] Existing profile rendering checked
```

---

# Bahasa Indonesia

## Fitur

### Arsitektur profile-first

Setiap contributor direpresentasikan oleh satu file JSON kecil di:

```text
data/profiles/
```

Jadi contributor tidak perlu mengedit HTML untuk menambahkan profile.

### Manifest otomatis

Script:

```text
scripts/build-data.mjs
```

akan membaca profile, melakukan validasi, memberikan default yang aman, menentukan `joinedAt` jika Git history tersedia, kemudian membuat:

```text
data/profiles.json
data/community.json
```

Kedua file tersebut merupakan hasil generate.

### Enrichment GitHub

Script:

```text
scripts/enrich-github.mjs
```

mengambil metadata GitHub publik seperti:

- Avatar
- URL GitHub
- Display name
- Followers
- Jumlah repository publik
- Perkiraan total stars repository
- Top languages
- Aktivitas publik terbaru
- Activity streak
- Public activity matrix
- Contribution Aura
- Rarity tier ilustratif

Data tersebut bukan histori kontribusi privat secara lengkap.

### UI interaktif

EmberBoard menyediakan:

- Light/dark theme
- Neumorphic card
- Tilt interaction
- Magnetic CTA
- Pressable interaction
- Cursor glow
- Scroll progress
- Search/filter
- Profile modal
- Activity visualization
- Live merge/profile feed
- Responsive layout
- Dukungan `prefers-reduced-motion`

### Urutan contributor

Homepage hanya menampilkan **6 contributor terbaru** berdasarkan `joinedAt`.

Halaman:

```text
contributors.html
```

menampilkan directory lengkap.

---

## Arsitektur

Alur data utama:

```text
data/profiles/*.json
        ↓
scripts/build-data.mjs
        ↓
data/profiles.json
        ↓
scripts/enrich-github.mjs
        ↓
Frontend
        ↓
GitHub Pages
```

### Aturan penting

Jangan menambahkan contributor langsung ke:

```text
data/profiles.json
```

Tambahkan ke:

```text
data/profiles/<github-handle>.json
```

Kemudian jalankan build.

---

## Requirement

Minimal:

- Git
- Node.js 20+
- npm

Cek:

```bash
node --version
npm --version
git --version
```

Untuk preview lokal, gunakan static HTTP server.

---

## Menjalankan Secara Lokal

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

### 2. Validasi data

```bash
npm run validate
```

### 3. Jalankan server lokal

```bash
npx serve .
```

Buka URL yang diberikan oleh server.

### 4. Jalankan full build

```bash
npm run build
```

Perintah ini menjalankan:

```bash
node scripts/build-data.mjs
node scripts/enrich-github.mjs
```

---

## Struktur Project

```text
.
├── .github/workflows/
│   ├── deploy.yml
│   └── validate.yml
├── assets/
├── data/
│   ├── profiles/
│   │   ├── _TEMPLATE.json
│   │   └── *.json
│   ├── profiles.json
│   ├── community.json
│   └── site.json
├── scripts/
│   ├── build-data.mjs
│   ├── enrich-github.mjs
│   └── validator.mjs
├── index.html
├── contributors.html
├── app.js
├── contributors.js
├── styles.css
├── profiles.schema.json
├── CONTRIBUTING.md
├── package.json
└── README.md
```

### File sumber vs file generate

`data/profiles/*.json` adalah sumber utama contributor.

`data/profiles.json` dan `data/community.json` adalah hasil generate.

Jangan mengedit hasil generate secara manual kecuali Anda memang sedang mengembangkan pipeline build.

---

## Menambahkan Contributor

### Step 1 — Fork

Fork repository ke akun GitHub Anda.

### Step 2 — Buat branch

```bash
git checkout -b add-nama-github-anda
```

### Step 3 — Copy template

Copy:

```text
data/profiles/_TEMPLATE.json
```

menjadi:

```text
data/profiles/github-anda.json
```

### Step 4 — Isi profile

Versi minimum:

```json
{
  "github": "github-anda",
  "bio": "Saya membuat interface, tools, dan open-source project.",
  "skills": [
    "JavaScript",
    "Open Source",
    "Your Skill"
  ]
}
```

Contoh lebih lengkap:

```json
{
  "name": "Nama Anda",
  "github": "github-anda",
  "role": "Frontend Engineer",
  "avatar": "https://github.com/github-anda.png?size=160",
  "bio": "Saya membuat interface dan developer tools.",
  "skills": [
    "JavaScript",
    "TypeScript",
    "React",
    "CSS",
    "Open Source"
  ],
  "building": "Component library",
  "links": {
    "GitHub": "https://github.com/github-anda",
    "LinkedIn": "https://www.linkedin.com/in/github-anda/"
  },
  "projects": [
    {
      "name": "Project Saya",
      "url": "https://github.com/github-anda/project-saya",
      "kind": "Project"
    }
  ]
}
```

### Step 5 — Validasi

```bash
npm run validate
```

Jika berhasil, manifest akan dibuat ulang.

### Step 6 — Preview

```bash
npx serve .
```

Cek homepage dan halaman contributors.

### Step 7 — Commit

```bash
git add data/profiles/github-anda.json data/profiles.json data/community.json
git commit -m "feat: add github-anda profile"
```

### Step 8 — Push

```bash
git push origin add-nama-github-anda
```

### Step 9 — Pull Request

Buat Pull Request ke branch `main`.

CI akan melakukan validasi.

### Step 10 — Merge

Setelah merge, workflow deployment akan membangun ulang data dan melakukan deployment ke GitHub Pages.

---

## Schema Profile

Schema utama berada di:

```text
profiles.schema.json
```

Template berada di:

```text
data/profiles/_TEMPLATE.json
```

Field yang umum digunakan:

| Field | Tipe | Fungsi |
|---|---|---|
| `name` | string | Nama tampilan |
| `github` | string | Username GitHub |
| `role` | string | Role/profesi |
| `avatar` | string | URL avatar opsional |
| `bio` | string | Deskripsi singkat |
| `skills` | array | Skill/teknologi |
| `building` | string | Sedang membangun apa |
| `links` | object | Link eksternal |
| `projects` | array | Project pilihan |

### Tips skill

Gunakan skill yang pendek dan relevan.

Contoh:

```json
"skills": ["JavaScript", "React", "UI/UX", "Open Source"]
```

Hindari memasukkan paragraf panjang sebagai skill.

---

## Validasi dan Build

### Validasi

```bash
npm run validate
```

Menjalankan:

```bash
node scripts/build-data.mjs
```

### Base build

```bash
npm run build:base
```

### GitHub enrichment

```bash
npm run enrich
```

### Full build

```bash
npm run build
```

Full build menjalankan base build lalu enrichment GitHub.

---

## Enrichment GitHub

Enrichment menggunakan data publik GitHub.

Data yang dapat digunakan antara lain:

- Avatar
- Profile URL
- Followers
- Repository publik
- Stars
- Languages
- Public activity
- Activity streak
- Activity matrix
- Contribution Aura
- Rarity ilustratif

### Batasan

Public events GitHub **bukan histori kontribusi lengkap**.

Jangan menggunakan Contribution Aura atau rarity sebagai ukuran nilai seseorang. Itu adalah elemen visual/ilustratif dari EmberBoard.

### Token

Workflow menggunakan `GITHUB_TOKEN` milik GitHub Actions.

Jangan pernah memasukkan personal access token ke file profile atau source code.

---

## Deploy ke GitHub Pages

Workflow deployment:

```text
.github/workflows/deploy.yml
```

### Konfigurasi

Masuk ke:

```text
Repository → Settings → Pages
```

Pilih GitHub Actions sebagai source deployment.

Workflow menggunakan permission:

```yaml
contents: read
pages: write
id-token: write
```

### Alur deployment

```text
Push ke main
   ↓
Checkout
   ↓
Node 20
   ↓
npm run build
   ↓
Build _site
   ↓
Upload artifact
   ↓
Deploy GitHub Pages
```

---

## Workflow Pull Request

Workflow validasi berada di:

```text
.github/workflows/validate.yml
```

Workflow berjalan ketika Pull Request mengubah profile, schema, scripts, atau package configuration yang relevan.

Perintah validasi:

```bash
npm run validate
```

### Flow contributor

```text
Fork
 ↓
Branch
 ↓
Tambah JSON profile
 ↓
npm run validate
 ↓
Preview
 ↓
Commit
 ↓
Push
 ↓
Pull Request
 ↓
CI
 ↓
Review
 ↓
Merge
 ↓
Deploy
```

---

## Kustomisasi

### CSS

Visual utama berada di:

```text
styles.css
```

Di sinilah Anda dapat menemukan:

- Theme
- Typography
- Card
- Shadow
- Accent
- Responsive rules
- Animation
- Reduced-motion rules

### Homepage

```text
index.html
```

### Homepage JavaScript

```text
app.js
```

### Contributors page

```text
contributors.html
contributors.js
```

Jika hanya ingin menambahkan diri sebagai contributor, **jangan edit file-file tersebut**.

---

## Accessibility dan Motion

EmberBoard menggunakan banyak motion, tetapi tetap harus dapat digunakan oleh user yang menonaktifkan animasi.

Project menyediakan dukungan:

```css
prefers-reduced-motion: reduce
```

Saat menambahkan UI baru:

- Gunakan semantic HTML.
- Pertahankan keyboard navigation.
- Sediakan focus state.
- Jangan menjadikan hover sebagai satu-satunya cara mengakses fitur.
- Pastikan layout mobile tetap usable.
- Hormati reduced-motion preference.

---

## Catatan Security

Jangan memasukkan secret ke repository.

Contohnya:

```text
API key
GitHub personal access token
Password
Session token
Private credential
```

Untuk external resource, pertimbangkan:

- HTTPS
- CSP
- Privacy
- Supply-chain risk
- Dependency stability
- SRI bila relevan

Generated data jangan dijadikan source of truth manual.

Jika output generate salah, periksa profile source atau build script.

---

## Troubleshooting

### `npm run validate` gagal

Jalankan:

```bash
npm run validate
```

Lihat error pertama.

Penyebab umum:

- JSON invalid
- `github` kosong
- `bio` kosong
- `skills` bukan array
- Struktur field salah
- URL tidak valid

### JSON error

Cek:

- koma
- tanda kutip
- `{}`
- `[]`

### Profile tidak muncul

Periksa:

1. File berada di `data/profiles/`.
2. Nama file sesuai GitHub handle.
3. Field `github` benar.
4. `npm run validate` berhasil.
5. Profile muncul di `data/profiles.json` setelah build.
6. Browser tidak menggunakan data lama/cache lama.

### Profile ada di Contributors tetapi tidak di homepage

Ini normal jika profile bukan termasuk 6 profile terbaru.

Homepage hanya menampilkan 6 contributor terbaru.

Gunakan:

```text
contributors.html
```

untuk melihat semuanya.

### Metadata GitHub tidak muncul

Kemungkinan:

- Rate limit GitHub
- API error
- Username salah
- Data publik tidak tersedia
- Enrichment belum dijalankan

Coba:

```bash
npm run build
```

### JSON tidak bisa dimuat saat lokal

Jangan membuka:

```text
file://...
```

Gunakan:

```bash
npx serve .
```

### GitHub Pages gagal deploy

Periksa:

1. Pages menggunakan GitHub Actions.
2. Workflow permissions tersedia.
3. Push terjadi di `main`.
4. `npm run build` berhasil.
5. Artifact berhasil dibuat.
6. Deployment job berhasil.

---

## Checklist Development

Sebelum Pull Request:

```text
[ ] JSON profile valid
[ ] github benar
[ ] Bio singkat
[ ] Skills relevan
[ ] Links valid
[ ] npm run validate PASS
[ ] Local preview dicek
[ ] Mobile dicek
[ ] Light theme dicek
[ ] Dark theme dicek
[ ] Keyboard navigation dicek
[ ] Reduced motion dicek
[ ] Tidak ada secret
[ ] Generated files tidak rusak
```

Untuk perubahan UI:

```text
[ ] Desktop
[ ] Mobile
[ ] Hover
[ ] Focus
[ ] Touch
[ ] Reduced motion
[ ] Browser console
[ ] Existing profile
```

---

# License

See `LICENSE` for the license terms of this repository.

---

## Credits / Kredit

EmberBoard is built around a simple open-source idea:

> **Fork → Add your profile → Open a PR → Get merged → Become part of the wall.**

> **Fork → Tambahkan profile → Buat PR → Merge → Jadi bagian dari wall.**

🔥 **EmberBoard — Code has a face. Let it glow.**
