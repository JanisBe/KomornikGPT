# KomornikGPT — Project Reference for AI Agents

> **Purpose:** This file is the primary reference document for AI coding assistants working in this repository.  
> Keep it up to date when adding new modules, changing major dependencies or patterns.

---

## 1. Project Overview

**KomornikGPT** is a full-stack shared-expense management application (think Splitwise).  
Users create *groups*, add *expenses*, and the app calculates who owes whom using configurable split strategies and
multi-currency exchange rates (NBP API).

Key features:

- Email/password registration + Google & GitHub OAuth2 login
- JWT-based session management (access + refresh tokens in HTTP-only cookies)
- Multi-currency expenses with automatic exchange rate fetching
- Expense settlement calculations
- PWA (Progressive Web App) with Service Worker
- Email notifications (Spring Mail)
- Prometheus metrics (Actuator + Micrometer)

---

## 2. Repository Layout

```
KomornikGPT/
├── src/
│   ├── main/
│   │   ├── java/com/janis/komornikgpt/   ← Backend (Spring Boot)
│   │   ├── frontend/komornik-gpt/        ← Frontend (Angular)
│   │   └── resources/                    ← application*.properties
│   └── test/
├── pom.xml                               ← Maven root (manages both)
├── Dockerfile                            ← Production image
├── local.Dockerfile                      ← Local dev image
├── docker-compose.yml                    ← Prod compose
├── docker-compose-local.yml              ← Local compose (PostgreSQL + pgAdmin)
├── prometheus.yml
└── agents.md                             ← THIS FILE
```

---

## 3. Backend

### 3.1 Technology Stack

| Item        | Value                                                    |
|-------------|----------------------------------------------------------|
| Language    | Java 25                                                  |
| Framework   | Spring Boot 4.2.0-M2                                     |
| Build tool  | Maven 3.9.9                                              |
| Database    | PostgreSQL 42.7.x (driver)                               |
| ORM         | Spring Data JPA / Hibernate                              |
| Security    | Spring Security + JJWT 0.13.0 + OAuth2 Client + WebAuthn |
| HTTP client | Spring `RestClient` (spring-boot-starter-restclient)     |
| Utilities   | Lombok 1.18.48                                           |
| Email       | Spring Mail                                              |
| Metrics     | Micrometer + Prometheus                                  |
| Templating  | Thymeleaf (email templates)                              |
| Testing     | JUnit 5, Spring Boot Test, Spring Security Test          |

### 3.2 Backend Root

```
src/main/java/com/janis/komornikgpt/
├── KomornikApp.java          ← @SpringBootApplication entry point
│
├── auth/                     ← Authentication & security
│   ├── AuthRestController.java
│   ├── AuthService.java
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   ├── RefreshTokenService.java
│   ├── CustomOAuth2UserService.java
│   ├── OAuth2AuthenticationSuccessHandler.java
│   ├── OAuth2AuthenticationFailureHandler.java
│   ├── WebAuthnAuthenticationSuccessHandler.java
│   ├── JpaUserCredentialRepository.java
│   ├── JpaPublicKeyCredentialUserEntityRepository.java
│   ├── WebAuthnCredential.java / WebAuthnCredentialRepository.java
│   ├── HttpCookieOAuth2AuthorizationRequestRepository.java
│   ├── CookieUtils.java
│   ├── CsrfCookieFilter.java
│   ├── SpaCsrfTokenRequestHandler.java
│   ├── SpaWebFilter.java             ← Forwards unknown paths to index.html (SPA)
│   ├── JwtAuthenticationEntryPoint.java
│   ├── RefreshToken.java / RefreshTokenRepository.java
│   └── LoginRequest.java / AuthResponse.java
│
├── config/                   ← Cross-cutting Spring configuration
│   ├── SecurityConfig.java   ← Main Spring Security filter chain
│   ├── SecurityBeansConfig.java
│   ├── HttpsRedirectConfig.java
│   └── WebConfig.java        ← CORS / MVC config
│
├── expense/                  ← Expense domain
│   ├── ExpenseRestController.java
│   ├── ExpenseService.java
│   ├── ExpenseSettlementService.java
│   ├── ExpenseRepository.java
│   ├── ExpenseCategoryService.java
│   ├── NBPExchangeService.java       ← Fetches PLN exchange rates from NBP API
│   ├── ExchangeRateRepository.java
│   ├── Expense.java / ExpenseDto.java
│   ├── ExpenseSplit.java / ExpenseSplitDto.java
│   ├── Currency.java (enum) / ExpenseCategory.java (enum)
│   └── Settlement.java / SettlementDto.java
│
├── group/                    ← Group domain
│   ├── GroupRestController.java
│   ├── GroupService.java
│   ├── GroupRepository.java
│   ├── Group.java / GroupDto.java
│   ├── CreateGroupRequest.java
│   └── UpdateGroupRequest.java
│
├── user/                     ← User domain
│   ├── UserRestController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   ├── PasswordRestController.java
│   ├── User.java / UserDto.java
│   └── Role.java (enum)
│
├── mail/                     ← Email sending
│
└── exception/                ← Global exception handling
```

### 3.3 Backend Patterns & Conventions

- **Layered architecture:** `Controller → Service → Repository`. No cross-layer skipping.
- **DTO pattern:** Entities are never exposed directly; use `*Dto` / `*Request` / `*Response` records or classes.
- **Database Schema:** Handled by Hibernate auto-DDL (`spring.jpa.hibernate.ddl-auto=update` or `create`). Flyway or
  Liquibase are **not** currently used.
- **Flat packages per domain:** All classes for a domain live in one package (no sub-packages like `controller/`,
  `service/`). New domains should follow the same convention.
- **REST controllers:** Return `ResponseEntity<T>`. Annotated with `@RestController`. Path prefix `/api/v1/...`. No
  OpenAPI/Swagger documentation is auto-generated; controllers are the single source of truth for API endpoints.
- **Security:** All REST endpoints under `/api/**` require authentication unless explicitly permitted.  
  Tokens are stored as HTTP-only cookies, not in `Authorization` header.  
  CSRF protection is enabled (double-cookie pattern). XSRF-TOKEN cookie → X-XSRF-TOKEN header.
- **OAuth2:** Google and GitHub providers. Success handler stores JWT in a short-lived redirect cookie.
- **SPA routing:** `SpaWebFilter` forwards non-API, non-asset requests to `index.html` so Angular routing works on
  refresh.
- **Lombok:** Used for `@Data`, `@Builder`, `@Slf4j`, `@RequiredArgsConstructor` etc. Do **not** add custom `equals`/
  `hashCode` on JPA entities.
- **Testing:** Use Mockito for mocking dependencies in Services, and `@WebMvcTest` with `@MockBean` for Controllers.

---

## 4. Frontend

### 4.1 Technology Stack

| Item         | Value                                             |
|--------------|---------------------------------------------------|
| Language     | TypeScript 5.9                                    |
| Framework    | Angular 22 (standalone components)                |
| UI Library   | Angular Material 22                               |
| HTTP         | Angular `HttpClient` with functional interceptors |
| State        | Angular Signals (preferred) + RxJS                |
| Styling      | SCSS (component-scoped)                           |
| PWA          | Angular Service Worker (`ngsw-worker.js`)         |
| Locale       | Polish (`pl-PL`), MAT_DATE_LOCALE set globally    |
| Excel export | SheetJS (xlsx)                                    |
| Testing      | Karma + Jasmine                                   |
| Linting      | angular-eslint + typescript-eslint                |

### 4.2 Frontend Root

```
src/main/frontend/komornik-gpt/
├── src/
│   └── app/
│       ├── app.component.ts        ← Root component (minimal, just router-outlet)
│       ├── app.config.ts           ← ApplicationConfig (providers, interceptors, PWA)
│       ├── app.routes.ts           ← Top-level lazy routes
│       │
│       ├── layout/
│       │   └── layout.component.ts ← Shell with toolbar, sidenav, PWA install prompt
│       │
│       ├── core/                   ← Singleton services, guards, interceptors, models
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── expense.service.ts
│       │   │   ├── group.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── password.service.ts
│       │   │   ├── social-auth.service.ts
│       │   │   ├── webauthn.service.ts
│       │   │   ├── notification.service.ts  ← Centralised MatSnackBar wrapper
│       │   │   ├── theme.service.ts
│       │   │   └── excel-export.service.ts
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts      ← Attaches credentials, handles 401
│       │   ├── models/                      ← TypeScript interfaces/types
│       │   └── config/
│       │
│       └── features/               ← Feature modules (lazy-loaded)
│           ├── auth/               ← Login, Register, OAuth callback, password flows
│           ├── groups/             ← Groups list, group details, group form
│           ├── expenses/           ← Add/view/edit expenses, my-expenses, dialogs
│           ├── profile/            ← Profile management
│           └── about/
│
├── angular.json
├── package.json
└── tsconfig.json
```

### 4.3 Frontend Patterns & Conventions

- **Standalone components only.** No `NgModule`. All components use `standalone: true` with explicit `imports: []`.
- **Control flow syntax:** Use the modern Angular control flow (`@if`, `@for`, `@switch`) — **never** `*ngIf` / `*ngFor`
  structural directives.
- **Lazy loading:** Every feature route uses `loadComponent()`. No eagerly loaded feature components.
- **Signals over BehaviorSubject** for component-level state. Use `signal()`, `computed()`, `effect()`. RxJS is still
  used for HTTP streams.
- **Services are `providedIn: 'root'`** (singleton). No lazy-provided services unless specifically scoped to a dialog.
- **Notifications:** Always use `NotificationService` for user-facing snackbar messages — never inject `MatSnackBar`
  directly in components.
- **Loading states:** Use `signal<boolean>(false)` for async loading indicators, not plain boolean properties.
- **HTTP:** All API calls go through services in `core/services/`. Components do not call `HttpClient` directly.
- **Auth interceptor:** Automatically adds `withCredentials: true` to every request. Handles 401 by redirecting to
  `/login`.
- **CSRF:** Angular's built-in XSRF handling configured in `app.config.ts` (`XSRF-TOKEN` cookie → `X-XSRF-TOKEN`
  header).
- **Theming:** Dark/light mode toggled via `ThemeService`, applied to `<body>` class.
- **Testing:** Karma/Jasmine is configured. Adhere to modern Angular testing practices, using `TestBed` combined with
  Component Harnesses (e.g. for Angular Material) where possible.

---

## 5. Build & Run

### Local Development (separate processes)

```bash
# Backend: Spring Boot dev server (port 8080, default profile: local)
./mvnw spring-boot:run -DskipFrontend=true

# Frontend: Angular dev server (port 4200, proxies /api to 8080)
cd src/main/frontend/komornik-gpt
pnpm start           # → ng serve (uses environment.ts & proxy.conf.json)
```

### Full Build (backend packages frontend)

```bash
# Runs pnpm install + pnpm run build, copies dist into Spring Boot static resources
./mvnw clean package
```

### Docker

```bash
# Production image
docker build -t komornikgpt .

# Local compose (app + postgres + pgadmin)
docker compose -f docker-compose-local.yml up
```

### Maven Profiles

| Profile        | Frontend build script | Use case                |
|----------------|-----------------------|-------------------------|
| *(none)*       | `pnpm run build`      | Default build (prod)    |
| `docker-build` | `pnpm run buildProd`  | Production Docker image |
| `docker-local` | `pnpm run buildDev`   | Local Docker image      |

---

## 6. Configuration Files

| File                                               | Purpose                                                             |
|----------------------------------------------------|---------------------------------------------------------------------|
| `.env.example`                                     | Template for environment variables (committed to git)               |
| `.env`                                             | Local secrets and environment variables (gitignored, auto-loaded)   |
| `src/main/resources/application.properties`        | Shared base config (defaults, JPA, OpenAPI, JWT, OAuth endpoints)   |
| `src/main/resources/application-local.properties`  | Local profile overrides (PostgreSQL localhost, MailDev, debug)      |
| `src/main/resources/application-prod.properties`   | Prod profile overrides (HTTPS, secure cookies, SMTP, metrics)       |
| `src/main/frontend/komornik-gpt/src/environments/` | Angular environment files (`environment.ts`, `environment.prod.ts`) |
| `docker-compose-local.yml`                         | Local infra (PostgreSQL, pgAdmin)                                   |
| `prometheus.yml`                                   | Prometheus scrape config                                            |

---

## 7. Key Domain Concepts

| Term           | Description                                                                                                       |
|----------------|-------------------------------------------------------------------------------------------------------------------|
| `Group`        | A shared-expense group. Has members, available currencies, a default currency, and expenses.                      |
| `Expense`      | A single expenditure assigned to a group. Has a payer, amount, currency, category, and splits.                    |
| `ExpenseSplit` | Represents how much each member owes for a given expense.                                                         |
| `Settlement`   | Calculated result of who should pay whom to balance out debts in a group.                                         |
| `Currency`     | Java enum of supported currencies. Exchange rates are fetched from NBP API and cached in `ExchangeRate` entities. |
| `RefreshToken` | Server-side stored token paired with a short-lived JWT access token for session renewal.                          |

---

## 8. CI/CD

- GitHub Actions workflow in `.github/workflows/`
- Pipeline: build Maven (with frontend) → build Docker image → push to registry → deploy
- Production runs as a single Docker container serving both backend API and Angular SPA as static resources.
- PWA is enabled and should work offline.
- After successful build, it pushes the image to the registry, downloads it on the Oracle Linux VM server running in
  Oracle Cloud Free Tier and runs the application as a docker container.