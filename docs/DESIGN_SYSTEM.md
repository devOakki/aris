# ARIS — Official Frontend Design System & Color Palette

> **Source:** Extracted from official Dev Bhoomi Uttarakhand University (DBUU) brand identity and institutional ranking cards.

---

## 1. Core Brand Color Palette

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DBUU BRAND PALETTE                              │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│ 1. DBUU Gold │ 2. DBUU Navy │ 3. DBUU Red  │ 4. DBUU      │ 5. DBUU Royal    │
│    (Amber)   │  (Midnight)  │  (Crimson)   │    Orange    │      Blue        │
│   #F5A623    │   #0F2137    │   #B81D24    │   #F36E21    │    #1A4DBE       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
```

| Token Name | Hex Code | RGB | HSL | Best Used For |
|---|---|---|---|---|
| `--dbuu-gold` | `#F5A623` | `rgb(245, 166, 35)` | `hsl(37, 91%, 55%)` | Highlights, badges, rank accents, attention metrics |
| `--dbuu-navy` | `#0F2137` | `rgb(15, 33, 55)` | `hsl(213, 57%, 14%)` | Primary header, dark navigation bars, cards |
| `--dbuu-red` | `#B81D24` | `rgb(184, 29, 36)` | `hsl(357, 73%, 42%)` | Institutional heritage, critical alerts, rejections |
| `--dbuu-orange` | `#F36E21` | `rgb(243, 110, 33)` | `hsl(22, 89%, 54%)` | Interactive buttons, pending badges, deadline warnings |
| `--dbuu-royal` | `#1A4DBE` | `rgb(26, 77, 190)` | `hsl(221, 76%, 42%)` | Primary CTAs, active links, supervisor portals |
| `--dbuu-plum` | `#4A154B` | `rgb(74, 21, 75)` | `hsl(299, 56%, 19%)` | Dean dashboard, executive gradients |

---

## 2. Signature Brand Gradients

```css
/* 1. DBUU Institutional Hero (Deep Navy to Plum) */
--grad-hero: linear-gradient(135deg, #0F2137 0%, #1A2B4C 50%, #4A154B 100%);

/* 2. DBUU Plum to Crimson (Extracted from 25th Ranked Card) */
--grad-plum-crimson: linear-gradient(135deg, #3B1B48 0%, #7E1935 50%, #B81D24 100%);

/* 3. DBUU Amber Energy (Extracted from 1st & 31st Ranked Cards) */
--grad-gold-orange: linear-gradient(135deg, #F5A623 0%, #F36E21 100%);

/* 4. DBUU Royal Blue Stream */
--grad-royal-cobalt: linear-gradient(135deg, #1A4DBE 0%, #2563EB 100%);

/* 5. Dark Surface Glassmorphism Background */
--grad-surface: linear-gradient(180deg, rgba(15, 33, 55, 0.85) 0%, rgba(11, 15, 25, 0.95) 100%);
```

---

## 3. Role-Based Semantic Color Mapping (4 Portals)

Every user role in ARIS has a distinct accent color for immediate visual recognition:

| Role | Accent Color | Hex | Badge Class | Purpose |
|---|---|---|---|---|
| 🎓 **Student** | **Sky / Royal Blue** | `#1A4DBE` | `bg-blue-900/30 text-blue-300 border-blue-500/40` | Group formation, proposal drafts, S3 uploads |
| 👨‍🏫 **Supervisor** | **Emerald / Teal** | `#10B981` | `bg-emerald-900/30 text-emerald-300 border-emerald-500/40` | Idea manager, capacity quotas, proposal feedback |
| 🏛️ **HOD** | **DBUU Orange** | `#F36E21` | `bg-orange-900/30 text-orange-300 border-orange-500/40` | 1-by-1 project review, departmental approvals |
| 📜 **Dean** | **Plum / Violet** | `#8B5CF6` | `bg-purple-900/30 text-purple-300 border-purple-500/40` | Consolidated school view, final university approval |

---

## 4. Status & Workflow Badge Tokens

| Status | Color | Background | Border | Text |
|---|---|---|---|---|
| `FORMED` | Slate | `#1E293B` | `#475569` | `#94A3B8` |
| `SUPERVISOR_PENDING` | Amber | `rgba(245, 166, 35, 0.15)` | `#F5A623` | `#FBBF24` |
| `ACTIVE` | Emerald | `rgba(16, 185, 129, 0.15)` | `#10B981` | `#34D399` |
| `SUBMITTED` | Royal Blue | `rgba(26, 77, 190, 0.15)` | `#1A4DBE` | `#60A5FA` |
| `HOD_APPROVED` | Orange | `rgba(243, 110, 33, 0.15)` | `#F36E21` | `#FB923C` |
| `DEAN_APPROVED` | Green / Gold | `rgba(16, 185, 129, 0.2)` | `#10B981` | `#6EE7B7` |
| `REJECTED` | DBUU Red | `rgba(184, 29, 36, 0.15)` | `#B81D24` | `#FCA5A5` |

---

## 5. Typography & Font System

We will use modern Google Fonts with high readability:

```html
<!-- Google Fonts CDN to import in Next.js layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Font Pairings:
1. **Primary UI Font:** **`Plus Jakarta Sans`** (or `Inter`)
   - Clean, geometric, extremely crisp on all displays.
   - Weights: `400` (Regular body), `500` (Medium labels), `600` (SemiBold titles), `700`/`800` (Bold metrics & headers).
2. **Monospace Font:** **`JetBrains Mono`**
   - For ERP IDs, S3 bucket keys, Git commit hashes, and code technology tags.

---

## 6. Tailwind CSS Ready Configuration (`tailwind.config.ts`)

When we initialize the Next.js frontend, we will paste this clean configuration:

```typescript
// client/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dbuu: {
          navy: {
            DEFAULT: "#0F2137",
            dark: "#0B192C",
            light: "#1A2B4C",
          },
          gold: {
            DEFAULT: "#F5A623",
            light: "#FBBF24",
            dark: "#D97706",
          },
          red: {
            DEFAULT: "#B81D24",
            light: "#DC2626",
            dark: "#991B1B",
          },
          orange: {
            DEFAULT: "#F36E21",
            light: "#FB923C",
            dark: "#C2410C",
          },
          royal: {
            DEFAULT: "#1A4DBE",
            light: "#3B82F6",
            dark: "#1E3A8A",
          },
          plum: {
            DEFAULT: "#4A154B",
            light: "#7E1935",
            dark: "#2A0845",
          },
        },
        surface: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          hover: "#1E293B",
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```
