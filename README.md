# LeagueLine — Esports League Management System

LeagueLine is a full-stack esports management web application built for **IT342 Project Development** (Project Increment 1). It supports user registration, JWT-based authentication with server-side token revocation, role-based access control (RBAC), and role-specific dashboards backed by **Supabase PostgreSQL**.

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.3.5, Spring Security, Spring Data JPA (Hibernate), JJWT (`0.12.6`), Maven (`mvnw.cmd`)
- **Database:** Supabase PostgreSQL (`users`, `revoked_tokens`, `leagues`)
- **Frontend:** React (Vite), React Router, Axios, TanStack React Query, Tailwind CSS

## Project Structure

```text
LeagueLine-main/
├── leagueline-backend/
│   ├── src/main/java/com/leagueline/
│   │   ├── config/         # Startup seeding (LeagueSeedConfig)
│   │   ├── controller/     # AuthController, DashboardController, PublicLeagueController
│   │   ├── dto/            # Request and response payloads
│   │   ├── exception/      # ApiException & GlobalExceptionHandler
│   │   ├── model/          # User, Role, League, LeagueStatus, RevokedToken
│   │   ├── repository/     # Spring Data JPA repositories
│   │   ├── security/       # JwtService, JwtAuthenticationFilter, CustomUserDetailsService, SecurityConfig
│   │   └── service/        # AuthService
│   └── src/main/resources/application.properties
├── leagueline-frontend/
│   ├── src/
│   │   ├── components/     # ProtectedRoute, PublicLayout, DashboardLayout, UI helpers
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useAuth
│   │   ├── pages/          # HubPage, LoginPage, RegisterPage, UnauthorizedPage, and role dashboards
│   │   └── services/       # api.js, authService.js, dashboardService.js, leagueService.js
│   └── .env.example
└── README.md

Implemented Features (Increment 1)
User Account Creation

Registration endpoint (POST /api/auth/register) and UI (/register) with input validation and role selection (ORGANIZER, TEAM_MANAGER, FAN).

Duplicate email detection (409 Conflict) and BCrypt password hashing prior to database storage.

User Login and Logout

Credential authentication (POST /api/auth/login) and UI (/login) returning signed JWT tokens, with session verification via GET /api/auth/me.

Logout (POST /api/auth/logout) revokes tokens server-side by storing SHA-256 token hashes in revoked_tokens.

Role-Based User Dashboard

Dedicated dashboards and navigation for League Organizer (/organizer), Team Manager (/manager), and Fan / Player (/fan).

Enforced on both frontend (ProtectedRoute and /unauthorized) and backend (SecurityConfig and @PreAuthorize).

Running Locally
1. Backend (leagueline-backend)
Set DB_PASSWORD in your terminal before starting Spring Boot:

Command Prompt (cmd):

DOS
cd leagueline-backend
set DB_PASSWORD=your_supabase_db_password
mvnw.cmd spring-boot:run
PowerShell:

PowerShell
cd leagueline-backend
$env:DB_PASSWORD="your_supabase_db_password"
.\mvnw.cmd spring-boot:run
The API runs on http://localhost:8080 (health check: http://localhost:8080/api/health).

2. Frontend (leagueline-frontend)
DOS
cd leagueline-frontend
npm install
npm run dev
The web app runs on http://localhost:5173.


---

### 2. Commit and Push `README.md`
Run this in your repository root terminal (`C:\Users\L23Y19W13\Downloads\LeagueLine-main\LeagueLine-main`)[cite: 4, 8]:

```cmd
git add README.md
git commit -m "docs: add project README with setup instructions and Increment 1 overview"
git push