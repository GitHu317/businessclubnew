# Business Club at Kotebe University of Education | Science Shared Campus

A fully functional, production-ready full-stack web application for the Business Club at Kotebe University of Education. The platform combines a Learning Management System (LMS), verifiable digital certificates, interactive business games, and a membership management system — all built for student entrepreneurs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS v3 + Lucide React icons + React Router v7 |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Auth** | JWT (jsonwebtoken) + bcryptjs password hashing |
| **ORM** | Prisma |
| **PDF Generation** | PDFKit (server-side certificate PDF rendering) |

---

## Features (7 Modules)

### 1. User Authentication & Dashboard
- Student/Member and Admin/Board of Directors (BOD) roles with role-based access control (RBAC)
- JWT-based authentication with bcrypt password hashing; `bodRole` field distinguishes President vs BOD Member
- Student dashboard: membership status, enrolled courses with progress bars, certificates, registered games
- Profile display with membership tier badge (Pending / Active / Verified)
- Demo account quick-fill buttons on the login page

### 2. Membership Status & Board Member Page (President-only management)
- Dynamic membership tiers: **Pending** → **Active** → **Verified**
- Admin can change any member's status from the Membership Management panel
- Dedicated Board Members page with exactly 6 board members
- Each member card: avatar (photo or initials fallback), title, bio, email, social links (LinkedIn, Twitter, Instagram)
- Board roles: President, Vice President, Secretary General, Finance Head, Events & Games Coordinator, Marketing & Outreach Lead
- **RBAC:** Only the President can add, edit, or delete board members — the 5 BOD Members are restricted from these actions (both in the UI and at the API level via the `presidentRequired` middleware)

### 3. LMS (Courses & Lessons)
- Admin panel: full CRUD for courses and lessons (create, edit, delete)
- Student: browse courses by category, view course detail with lesson sidebar
- Enroll in courses, mark lessons complete, automatic progress tracking
- Each course shows lesson count, exam count, level, and category

### 4. Interactive Exams & Verifiable Certificates
- Admin: exam builder with dynamic MCQ questions and multiple options
- Student: take exams interactively, instant auto-grading on submit
- Passing score configurable per exam (default 70%)
- Detailed results: per-question correct/incorrect breakdown
- On pass: auto-generated **Certificate of Completion** with:
  - Unique unforgeable Certificate ID (format: `KUE-BC-YYYY-XXXXXXXX`)
  - SHA-256 verification hash
- **Direct PDF download** — click "Download PDF" to save the certificate as a real PDF file (server-generated via PDFKit, matching the on-screen layout with decorative border, gold corners, emblem, recipient name, course title, date, certificate ID, verification note, and signature lines)
- Printable certificate (browser print-to-PDF via CSS `@media print`) also available
- **Public verification route** `/verify/:id` — anyone can verify a certificate by ID without logging in

### 5. Business Games & Club Activities
- Interactive section for competition schedules, simulation rules, and announcements
- Game types: Simulation, Case Challenge, Competition
- Status badges: Upcoming, Ongoing, Completed
- Expandable rules & scoring section per game
- Registration links for members
- Club announcements displayed on the home page

### 6. BOD Activity Logging & Audit Trail (President-only)
- Every BOD admin action is automatically logged: login timestamps, page views, and all data updates/deletions (board members, courses, lessons, exams, games, announcements, membership-status changes, and certificate PDF downloads)
- Each log entry records the user, action type (LOGIN, LOGOUT, PAGE_VIEW, CREATE, UPDATE, DELETE, DOWNLOAD), resource type, description, IP address, user agent, and timestamp
- The **Activity Log** tab (visible only to the President) displays a full audit trail with summary stats, top-actor badges, and filtering by action/resource type
- BOD Members cannot access the Activity Log (restricted via RBAC at both the UI and API level)

---

## Project Structure

```
business-club/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/client.js      # Centralized API client with JWT
│   │   ├── context/AuthContext.jsx
│   │   ├── components/        # Navbar, Footer, Common (ProtectedRoute, badges, etc.)
│   │   ├── pages/             # Home, Login, Signup, Dashboard, BoardMembers,
│   │   │                      # Courses, CourseDetail, ExamPage, Certificates,
│   │   │                      # Verify, Games, NotFound, AdminPanel
│   │   │   └── admin/         # AdminCourses, AdminExams, AdminBoard,
│   │   │                      # AdminGames, AdminMembers, AdminAnnouncements,
│   │   │                      # AdminActivity (audit trail - President only)
│   │   ├── App.jsx            # Router with all routes
│   │   ├── main.jsx
│   │   └── index.css          # Tailwind + component classes + print styles
│   ├── vite.config.js         # Dev proxy /api → localhost:5050
│   ├── tailwind.config.js     # Custom brand (blue) + gold palettes
│   └── index.html
│
└── server/                    # Node.js + Express backend
    ├── src/
    │   ├── index.js           # Express app, CORS, route mounting
    │   ├── routes/
    │   │   ├── auth.js        # signup, login, me, profile update + login audit log
    │   │   ├── dashboard.js   # student dashboard, membership status, admin users + activity log
    │   │   ├── boardMembers.js  # board member CRUD (President-only) + activity log
    │   │   ├── courses.js     # course CRUD, lessons CRUD, enroll, complete + activity log
    │   │   ├── exams.js       # get exam, create exam, submit + auto-grade + cert + activity log
    │   │   ├── certificates.js # /mine (auth), /:id (public verify), /:id/pdf (PDF download)
    │   │   ├── games.js       # game CRUD + register + activity log
    │   │   ├── announcements.js  # announcement CRUD + activity log
    │   │   └── activityLogs.js   # GET /api/activity-logs + /stats (President-only audit trail)
    │   ├── middleware/auth.js # authRequired, adminRequired, presidentRequired (RBAC)
    │   └── utils/
    │       ├── prisma.js      # PrismaClient singleton
    │       ├── jwt.js         # signToken / verifyToken (includes bodRole)
    │       ├── certificate.js # generateCertificateId, generateVerificationHash
    │       └── activityLog.js # logActivity() utility + safeBody() sanitizer
    ├── prisma/
    │   ├── schema.prisma      # 14 models (PostgreSQL on Neon) — User.bodRole, ActivityLog added
    │   └── seed.js            # Seeds 6 BOD admin accounts (1 President + 5 BOD), 1 student,
    │                          # 6 board members, 1 course, 5 lessons, 1 exam with 8 MCQs,
    │                          # 3 games, 3 announcements (idempotent)
    └── .env                   # PORT=5050, DATABASE_URL (Neon PostgreSQL), JWT_SECRET, CLIENT_URL
```

---

## Database Models

| Model | Description |
|---|---|
| **User** | id, email, password (hashed), fullName, role (STUDENT/ADMIN), **bodRole** (PRESIDENT/BOD/null — only set for Board of Directors admin accounts), department, membershipStatus (PENDING/ACTIVE/VERIFIED), tier |
| **ActivityLog** | id, userId, action (LOGIN/LOGOUT/PAGE_VIEW/CREATE/UPDATE/DELETE/DOWNLOAD), resourceType (BOARD_MEMBER/COURSE/LESSON/EXAM/GAME/ANNOUNCEMENT/USER/CERTIFICATE), resourceId, description, ipAddress, userAgent, metadata (JSON), createdAt — belongs to User |
| **BoardMember** | fullName, title, bio, photoUrl, email, linkedin, twitter, instagram, order |
| **Course** | title, slug, description, category, level, thumbnailUrl, published |
| **Lesson** | title, content, durationMins, order — belongs to Course |
| **Enrollment** | User ↔ Course with progress percentage |
| **LessonProgress** | Tracks completed lessons per enrollment |
| **Exam** | title, description, passingScore, durationMins — belongs to Course |
| **Question** | text, options (JSON array), correctIndex — belongs to Exam |
| **ExamAttempt** | score, passed, answers (JSON) — User ↔ Exam |
| **Certificate** | certificateId (unique), verificationHash, issuedAt — User ↔ Course |
| **BusinessGame** | title, type, status, description, rules, schedule, startDate, endDate, registrationLink |
| **GameRegistration** | User ↔ BusinessGame |
| **Announcement** | title, content, pinned, date |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend Setup
```bash
cd server
npm install

# The .env is already provided with:
# PORT=5050
# DATABASE_URL="postgresql://...your-neon-connection...?sslmode=require"
# JWT_SECRET=kotebe-business-club-super-secret-key-2024-change-in-production
# JWT_EXPIRES_IN=7d
# CLIENT_URL=http://localhost:5173

# Push the Prisma schema to the PostgreSQL database
npx prisma db push

# Seed the database with mock data (idempotent — safe to re-run)
npm run seed

# Start the server
npm run dev
# Server runs on http://localhost:5050
```

### Frontend Setup
```bash
cd client
npm install

# Start the dev server (proxies /api to localhost:5050)
npm run dev
# Frontend runs on http://localhost:5173

# Or build for production
npm run build
# Output in dist/
```

---

## Demo Accounts

The database is seeded with 6 Board of Directors (BOD) admin accounts plus 1 student. All 6 BOD accounts have `role=ADMIN` (so they can all log in to the admin panel), but only the President has full management access — the 5 BOD Members are restricted by RBAC from managing board members and viewing the activity log.

| Role | Name | Email | Password | bodRole |
|---|---|---|---|---|
  console.log('   President:  acct-tg6vymkgcvm88k@kuebc.edu / 2dTXW0T7FCvgVp8BbvWSIx!9');
  console.log('   BOD 1:      acct-bejopzqjmyldpt@kuebc.edu / SF4FC9u2mk4Pqj9wM2QVWe!9');
  console.log('   BOD 2:      acct-avp33ositg0jln@kuebc.edu / 1bkTY7fhylco1OLlm33TAn!9');
  console.log('   BOD 3:      acct-h3ana4aosicvuz@kuebc.edu / MxcphN81lNV2S7jEYndn8D!9');
  console.log('   BOD 4:      acct-1rn52amlhd3i5t@kuebc.edu / ucps2Gr6DQNEsAIFmwO126!9');
  console.log('   BOD 5:      acct-gpok13t5cpubhl@kuebc.edu / 8Sp18fxCSC3UpnK77JSWs7!9');
  console.log('   Student:    acct-cdebh6sbpkatu3@kuebc.edu / FyQLQ1kGp5wuvQBQ4cd30m!9');

**What each role can do in the admin panel:**
- **President** — sees all tabs (Overview, Courses, Exams, Games, Members, Announcements, Board Members, Activity Log) and can perform all CRUD operations including managing board members and viewing the audit trail
- **BOD Member** — sees Overview, Courses, Exams, Games, Members, and Announcements tabs only; the "Board Members" and "Activity Log" tabs are hidden, and direct URL access to those routes redirects back to the admin overview; attempting board-member CRUD via API returns 403
- **Student** — accesses the student-facing pages (courses, exams, certificates, dashboard) only

The login page has "Student demo" and "Admin demo" buttons that auto-fill credentials.

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Register new student | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Get current user | Required |
| PUT | `/api/auth/profile` | Update profile | Required |

### Dashboard
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/dashboard` | Student dashboard data | Required |
| PUT | `/api/dashboard/membership-status` | Update member status | Admin |
| GET | `/api/dashboard/admin/users` | List all users | Admin |

### Board Members
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/board-members` | List all board members | Public |
| POST | `/api/board-members` | Create | President |
| PUT | `/api/board-members/:id` | Update | President |
| DELETE | `/api/board-members/:id` | Delete | President |

### Courses & Lessons
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/courses` | List published courses | Public |
| GET | `/api/courses/:slug` | Get course with lessons & exams | Public |
| POST | `/api/courses` | Create course | Admin |
| PUT | `/api/courses/:id` | Update course | Admin |
| DELETE | `/api/courses/:id` | Delete course | Admin |
| POST | `/api/courses/:courseId/lessons` | Create lesson | Admin |
| PUT | `/api/courses/:courseId/lessons/:id` | Update lesson | Admin |
| DELETE | `/api/courses/:courseId/lessons/:id` | Delete lesson | Admin |
| POST | `/api/courses/:slug/enroll` | Enroll in course | Required |
| POST | `/api/courses/:slug/lessons/:lessonId/complete` | Mark lesson complete | Required |

### Exams
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/exams/:id` | Get exam (hides correctIndex) | Required |
| POST | `/api/exams` | Create exam with questions | Admin |
| PUT | `/api/exams/:id` | Update exam | Admin |
| DELETE | `/api/exams/:id` | Delete exam | Admin |
| POST | `/api/exams/:id/submit` | Submit answers → auto-grade → issue certificate if passed | Required |

### Certificates
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/certificates/mine` | List my certificates | Required |
| GET | `/api/certificates/:certificateId` | **Public verification** — verify any certificate by ID | Public |
| GET | `/api/certificates/:certificateId/pdf` | **Download certificate as PDF** (server-generated via PDFKit, matches on-screen layout) | Public |

### Activity Logs (Audit Trail)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/activity-logs` | List all activity log entries (supports `?action=`, `?resourceType=`, `?userId=`, `?limit=` filters) | President |
| GET | `/api/activity-logs/stats` | Aggregate stats (total count, by-action grouping, by-user grouping with user details) | President |

### Business Games
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/games` | List all games | Public |
| POST | `/api/games` | Create game | Admin |
| PUT | `/api/games/:id` | Update game | Admin |
| DELETE | `/api/games/:id` | Delete game | Admin |
| POST | `/api/games/:id/register` | Register for a game | Required |

### Announcements
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/announcements` | List announcements | Public |
| POST | `/api/announcements` | Create | Admin |
| PUT | `/api/announcements/:id` | Update | Admin |
| DELETE | `/api/announcements/:id` | Delete | Admin |

---

## Certificate Verification & PDF Download

Every certificate issued by the platform carries:
1. **Unique Certificate ID** — format `KUE-BC-YYYY-XXXXXXXX` (e.g., `KUE-BC-2026-674F7DD9`)
2. **SHA-256 Verification Hash** — cryptographic hash linking recipient, course, and issue date

Anyone can verify a certificate publicly at `/verify` by entering the Certificate ID — no login required. The system returns the recipient name, course title, issue date, and verification hash, confirming authenticity.

**PDF Download:** From the "My Certificates" page or the individual certificate view, click the "Download PDF" button to download the certificate as a real PDF file. The PDF is generated server-side by PDFKit and reproduces the full on-screen certificate layout — decorative navy/gold double border, gold corner accents, circular emblem, "Certificate of Completion" title, recipient name, course title, date issued, certificate ID, verification note, and signature lines with a center seal. The PDF endpoint is also publicly accessible at `GET /api/certificates/:certificateId/pdf` for direct linking.

---

## Role-Based Access Control (RBAC)

The admin panel is shared by all 6 Board of Directors accounts, but access is tiered:

| Capability | President | BOD Member |
|---|---|---|
| View Overview, Courses, Exams, Games, Members, Announcements | ✅ | ✅ |
| Create/Edit/Delete courses, lessons, exams, games, announcements | ✅ | ✅ |
| Update membership status | ✅ | ✅ |
| View "Board Members" tab & manage board members | ✅ | ❌ (hidden + 403) |
| View "Activity Log" tab (audit trail) | ✅ | ❌ (hidden + 403) |

**How it works:**
- **Backend:** The `presidentRequired` middleware checks `role === 'ADMIN' && bodRole === 'PRESIDENT'`. Board member CRUD routes and the activity-logs routes are protected by this middleware; BOD Members receive a `403 Forbidden` response.
- **Frontend:** The `ProtectedRoute` component accepts a `presidentOnly` prop. The AdminPanel conditionally renders the "Board Members" and "Activity Log" tabs only when `user.bodRole === 'PRESIDENT'`. Direct URL navigation to `/admin/board` or `/admin/activity` by a non-President redirects back to `/admin`.
- **JWT:** The `bodRole` is included in the JWT payload so the frontend can make immediate access decisions without an extra API call.

---

## Activity Logging (Audit Trail)

All Board of Directors admin actions are automatically recorded in the `ActivityLog` table for full accountability:

- **LOGIN** — recorded each time a BOD admin signs in (timestamp, IP, user agent)
- **CREATE / UPDATE / DELETE** — recorded for board members, courses, lessons, exams, games, announcements, and membership-status changes (includes resource type, resource ID, description, and a sanitized metadata snapshot of the request body)
- **DOWNLOAD** — recorded when a certificate PDF is downloaded (when the requester is authenticated)

The President can view the complete audit trail in the admin panel's "Activity Log" tab, which shows summary stats (total events, breakdown by action), top-actor badges, and a filterable list of log entries (filter by action type or resource type, plus free-text search). Each entry displays the actor's name, their bodRole badge, the action with a color-coded icon, a human-readable description, the IP address, and a relative timestamp.

---

## Database

The project uses **PostgreSQL hosted on Neon** (serverless Postgres). The Prisma schema (`server/prisma/schema.prisma`) has `provider = "postgresql"` and the connection string is configured in `server/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
```

The schema has been pushed to the live Neon database with `npx prisma db push`. To reset/reseed, run `npm run seed` (the seed is idempotent — safe to run multiple times).

**Switching to a different PostgreSQL instance:** Update `DATABASE_URL` in `server/.env`, then run:
```bash
cd server
npx prisma db push --accept-data-loss
npm run seed
```

---

## License

Built for the Business Club at Kotebe University of Education | Science Shared Campus.
© 2026 Business Club. All rights reserved. Built for students, by students.
