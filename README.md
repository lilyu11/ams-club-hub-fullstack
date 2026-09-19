# AmsClubHub

## Project Overview
**AmsClubHub** is a club management system for students/schools, allowing clubs to post recruitment announcements/event activities, and enabling students to easily search, discover, and join clubs.

**Mission**: Helping clubs promote events/member recruitment effectively.

## Key Features (Highlights)
- **User authorization**: Register, login, logout, send otp via email for authorization.
- **Club & User Management**: 
  + For students: Explore and follow clubs, interact with posts or events, add reminders.
  + For club admins: Organize club, add posts or events, edit club profile, and setup reminders.
- **Deadline Posts**: Clubs can post with a `deadline` (UTC) to trigger reminders.
- **Automated Email Reminder Generation & Delivery**
  + When a new post with a deadline is created, the system automatically generates a **reminder** for followers who have `auto_reminder` enabled.
  + A **Scheduler** runs periodically to send emails as soon as the `deadline` arrives.
  + Includes a **backstop** (runs upon API requests, rate-limited) to compensate for scenarios where free-tier hosting sleeps/freezes, causing APScheduler to run inconsistently.
- **Operational Monitoring**
  + Endpoint supports `HEAD` requests to accommodate **UptimeRobot**.
  + Includes a **GitHub Actions** workflow to ping "keep-alive" for the backend on Render and trigger reminder-running jobs.
- **UX/UI**: 
  + Customized for both desktop and mobile
  + Minimalism, includes dark mode and light mode
  + Notifies via toasts

## Tools 
### Backend & API
- **FastAPI** (HTTP API)
- **SQLAlchemy ORM** + **PostgreSQL** (Supabase)
- **APScheduler** (Periodic jobs: create reminders, send reminders, cleanup)
- **Redis** (Caching / auxiliary)

### Email / Notifications
- **Brevo SMTP API** (Sending reminder emails)
- **Fallback SMTP** (If Brevo is not configured)

### Frontend
- **Next.js** (App Router)
- **Axios** (API calls)
- UI components (Shadcn-style)

### Operations & CI/CD
- **Cloudfare** (Frontend hosting)
- **Render** (Backend hosting)
- **UptimeRobot** (Uptime monitoring)
- **GitHub Actions** (Cron keep-alive + trigger reminder execution)

## Setup & Running on Localhost (Quick Guide)
> Below is how to run locally based on the existing structure in the repository.

### 1) Start PostgreSQL + Redis with Docker
```bash
cd amsclubhub-backend
docker compose up -d
```

### 2) Configure backend
- Copy the sample environment file:
```bash
cd amsclubhub-backend
copy .env.example .env
```
- Edit the required variables in .env (especially: SECRET_KEY, DATABASE_URL, REDIS_URL, and SMTP/Brevo configurations if you want to send emails).

### 3) Run backend
```bash
cd amsclubhub-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4) Run frontend Next.js
```bash
cd amsclubhub-frontend
npm run dev
```
Open: `http://localhost:3000`.

> Note: The frontend currently has an API baseURL. If you want to call the local backend, please edit `amsclubhub-frontend/src/lib/api.ts` to point to `http://localhost:8000/api/v1` (depending on the project's current configuration).

## Screenshots 
> Vietnamese language version

