# ARIS — Project Log & Decision Record

## 1. Project Overview
- **Project Name:** ARIS (Academic Repository & Institutional System)
- **Institution:** Dev Bhoomi Uttarakhand University (DBUU)
- **Context:** BCA 5th Semester Minor Project
- **Developer:** Akhil (Solo)
- **Repository:** `https://github.com/devOakki/aris.git`

---

## 2. Core Architecture & Tech Stack Decisions

| Component | Choice | Rationale & Why |
|---|---|---|
| **Frontend** | **Next.js 14 (App Router) + TypeScript** | Enables modern server/client component architecture, route-level middleware for RBAC, and gives strong industry-relevant experience. |
| **Styling & UI** | **Tailwind CSS + shadcn/ui** | Native fit for Next.js, accessible, clean component customization, and avoids SSR styling conflicts. |
| **Design System** | **DBUU Brand Colors (Gold, Navy, Red, Orange, Royal Blue, Plum)** | Extracted from official university branding cards; mapped to distinct role accents (Student, Supervisor, HOD, Dean). Documented in `docs/DESIGN_SYSTEM.md`. |
| **Backend** | **Django + Django REST Framework (DRF)** | Fast API development, strong ORM, built-in security, role-based auth support, and seamless Python ecosystem integration. |
| **Database** | **PostgreSQL** | Relational integrity for hierarchical data (User/Group/Supervisor mapping) combined with `JSONField` + GIN indexing for tech stacks and domains. |
| **File Storage** | **AWS S3 (Free Tier 5GB Standard Storage)** | Provides 5 GB free object storage for 12 months with 20k GET / 2k PUT requests per month. Enables hands-on AWS cloud experience, presigned upload URLs (no server memory bottleneck), and private bucket ACLs for secure student documents. |
| **Authentication** | **JWT (`djangorestframework-simplejwt`)** | Stateless, token-based authentication with role payloads consumed by Next.js middleware for protected routing. |

---

## 3. Scope & Workflow Decisions

### Scope Rationalization
- **Initial Idea:** 20-module university-wide ERP (Examination, NAAC compliance, AI OCR, etc.).
- **Decision:** Narrowed down scope to **Phase 1: Academic Project Management System (Minor I, Minor II, Major)**.
- **Why:** Solves an immediate, high-friction problem for DBUU while remaining 100% buildable and deliverable by a solo developer within one semester.

### Role Hierarchy & Responsibilities
1. **Student:** Registers academic details, forms groups (max 3), selects supervisor, picks/proposes project ideas, uploads project deliverables (GitHub URL, Synopsis, PPT, Final Report).
2. **Supervisor (Faculty):** Opts in voluntarily, sets max group quota (default: 10), posts up to 10 project ideas, reviews/approves/rejects student proposals with mandatory feedback.
3. **HOD (Department Head):** Reviews submitted student project dossiers individually, evaluates reports, grants departmental approval.
4. **Dean (School Head):** Reviews consolidated view of all HOD-approved projects across departments for final sign-off.

### Key Functional Rules
- **Atomic Idea Thread-Locking:** Supervisor-provided project ideas can only be selected by one student group at a time (`is_taken = True`, locked at DB level via `select_for_update`).
- **Proposal Iteration:** If a custom proposal is rejected by a supervisor, the student group can re-propose with revisions, pick from the supervisor's idea list, or switch supervisors.
- **Semester-Scoped Groups:** Student groups last for one semester (max 3 students). Students can form different groups across semesters (Minor I vs Minor II vs Major).
- **System-Enforced Deadlines:** Milestone deadlines (Synopsis, PPT, Report) are enforced by the platform and can only be modified/extended by HOD or Dean.
- **Public Search Repository:** Once approved by the Dean, projects enter an indexed repository searchable by academic year, project type, domain, tech stack, supervisor, or keyword.

---

## 4. Entity Model Plan (13 Production Models)

1. `CustomUser` (`core`) — Base user model with role enum (`STUDENT`, `SUPERVISOR`, `HOD`, `DEAN`), department scoping, and university_id login.
2. `AcademicSession` (`accounts`) — University-wide session controller (`year`, `term`, `is_active`) managed directly by Admin with auto-deactivation.
3. `StudentProfile` (`accounts`) — Student academic details (`program`, `department`, `semester`) linked 1:1 with CustomUser.
4. `SupervisorProfile` (`accounts`) — Faculty details, designation, department, GIN-indexed expertise domains & technologies (`jsonb`), intake capacity (`max_groups`), and `is_accepting` toggle.
5. `ProjectTrack` (`projects`) — Extensible cohort engine created by HOD (`title`, `category`, `target_program`, `target_semester`, `is_mandatory`, `required_deliverables`, `min_media_files`, `max_media_files`). Supports Minor, Major, Research, Hardware, and Innovation.
6. `StudentGroup` (`projects`) — Team entity dynamically bound to a `ProjectTrack` and assigned supervisor.
7. `GroupMember` (`projects`) — Team roster (max group size configured per track, leader vs member).
8. `ProjectIdea` (`projects`) — Supervisor-posted ideas with atomic lock (`is_taken`, `taken_by`).
9. `ProjectProposal` (`projects`) — Proposed project details (`FROM_LIST` vs `OWN_IDEA`), versioning counter (`v1, v2`), and mandatory supervisor feedback.
10. `ProjectDeadline` (`projects`) — Hard milestone submission cutoffs bound to a `ProjectTrack`.
11. `ProjectSubmission` (`submissions`) — Deliverables store (GitHub repo URL, Live Demo URL, Cloudinary URLs for Synopsis, PPT, Report, Research Paper, and 5-10 screenshots gallery in `media_urls`).
12. `ApprovalRecord` (`approvals`) — Append-only immutable audit trail for HOD and Dean reviews with comments.
13. `Notification` (`notifications`) — In-app alerts for milestone deadlines, proposal status, and review outcomes.

---

## 5. Progress Log

| Date | Milestone / Action | Details |
|---|---|---|
| **2026-08-25** | Git Repository Setup | Initialized root git repo, linked to `devOakki/aris.git`, configured `.gitignore`. |
| **2026-08-25** | Project Context & Requirements Synthesis | Extracted full context from guide discussions and locked down the 4-role project scope. |
| **2026-08-25** | Project Documentation Log Initialized | Created `docs/PROJECT_LOG.md` for continuous tracking of decisions, architecture, and milestones. |
| **2026-08-25** | ERD & Schema Design Completed | Created initial `docs/ERD.md` with Mermaid diagram and DBML script. |
| **2026-08-25** | System Architecture Completed | Created `docs/SYSTEM_ARCHITECTURE.md` covering system components, Next.js / Django interaction, and state machines. |
| **2026-08-25** | DBUU Design System Specification | Created `docs/DESIGN_SYSTEM.md` extracting official branding, role mappings, and typography. |
| **2026-08-26** | Backend Skeleton Setup | Initialized Django 6.1, configured PostgreSQL 17 (`aris_db`), Cloudinary credentials, and 6 modular apps. |
| **2026-08-31** | Synopsis & Presentation v4 Completed | Produced official DBUU project synopsis and comprehensive 10-slide presentation (`ARIS_Presentation_v4.pptx`). |
| **2026-09-04** | Complete Production Schema & Models Implementation | Engineered 13 production models across all 6 Django apps (`core`, `accounts`, `projects`, `submissions`, `approvals`, `notifications`). Introduced `ProjectTrack` cohort engine, `AcademicSession` controller, live demo/screenshot gallery submissions, and department scoping. |
| **2026-09-04** | Django Admin Registration & Schema Migration | Registered all 13 models in each app's `admin.py` with custom search fields, filters, and list displays. Executed `makemigrations` and successfully applied all migrations to PostgreSQL 17. Created initial superuser. |
| **2026-09-04** | Production ERD v2 Generated | Generated updated, color-coded, 13-entity high-resolution ERD diagram on Eraser.io, synced to `assets/erd_diagram.png` and documented in `docs/ERD.md`. |
| **2026-09-04** | Database Seeding & Admin Configuration | Successfully seeded initial DBUU test accounts (Dean, HOD, 2 Faculty Supervisors, 4 Project Ideas, 1 Active Session, 1 Active Track, 4 Students). |
| **2026-09-04** | Complete REST API Backend Layer (Phase 2) | Engineered all serializers, permissions, views, and URL routers across all 6 Django apps (`core`, `accounts`, `projects`, `submissions`, `approvals`, `notifications`). Implemented custom JWT claims (`role`, `department`, `full_name`, `university_id`), dynamic faculty marketplace capacity calculation, progressive submission engine, HOD/Dean dossier review workflows, and automated notification triggers. |
| **2026-09-04** | Automated End-to-End API Integration Testing | Executed comprehensive test suite simulating real HTTP API calls across all 6 apps; 100% of endpoints verified operational. |

---

## 6. Next Steps
- [x] Create database seeding script to populate initial demo accounts (Dean, HOD, Supervisors, Students, active session & track).
- [x] Implement SimpleJWT Authentication API (`/api/auth/login/`, `/api/auth/register/`, `/api/auth/me/`) with custom token claims.
- [x] Build core REST API Serializers, Views, and URL Routing for Tracks, Groups, Proposals, Submissions, and Approvals.
- [ ] Initialize Next.js 14 App Router frontend in `client/` with Tailwind CSS, Lucide icons, and DBUU brand palette.
- [ ] Implement Clean Institutional Frontend Portals for the 4 roles:
  - **Student Portal**: Group creation, supervisor selection, proposal submission, progressive artifact upload.
  - **Supervisor Portal**: Idea bank management, group approval/rejection with feedback.
  - **HOD Portal**: Departmental dossier review and project track creation.
  - **Dean Portal**: Institutional project sign-off and public project archive.
