# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ClutchHub is a Free Fire esports tournament management platform. The backend is a **Spring Boot 3.2 / Java 21** application with PostgreSQL, JWT auth, Razorpay payments, WebSocket (STOMP) for real-time updates, and Cloudinary for assets.

Source lives at `/opt/clutchhub/app/` and is deployed as a systemd service (`clutchhub.service`) running on port 8080.

## Build & Run

```bash
# Build
mvn clean package -DskipTests

# Run locally
mvn spring-boot:run
# or
java -jar target/clutchhub-backend-1.0.0.jar

# Run a single test class
mvn -Dtest=SomeServiceTest test

# Deploy to VPS
scp target/clutchhub-backend-1.0.0.jar user@server:/opt/clutchhub/app/target/
systemctl restart clutchhub.service
tail -f /opt/clutchhub/logs/app.log
```

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `DB_USERNAME` / `DB_PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | HMAC-SHA256 key (≥256-bit) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` / `FIREBASE_PROJECT_ID` | Firebase Admin SDK |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment processing |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Asset storage |
| `APP_BASE_URL` / `BACKEND_URL` / `TOURNAMENT_LINK_BASE` | URL construction |
| `CORS_ORIGINS` | Allowed frontend origins |

## Architecture

```
com.clutchhub/
├── config/          SecurityConfig, WebSocketConfig, FirebaseConfig
├── controller/      Controllers.java (all REST controllers in one file)
├── dto/
│   ├── request/     AuthRequest, RegisterRequest, CompleteProfileRequest,
│   │                CreateTournamentRequest, UpdatePointsRequest,
│   │                PushCredentialsRequest, RegisterTeamRequest
│   └── response/    ApiResponse<T>, AuthResponse, TournamentResponse, LeaderboardEntry
├── enums/           UserRole, TournamentStatus, TeamStatus, GameType,
│                    TeamFormat, PaymentStatus, PaymentType, SubscriptionStatus, NotificationType
├── exception/       ClutchException (business errors → HTTP 400), GlobalExceptionHandler
├── model/           JPA entities (User, Tournament, Team, TeamPlayer, Points,
│                    Payment, OrganizerSubscription, Certificate, OrgHost, Message, PlacementRule)
├── repository/      Spring Data JPA repos; PointsRepository has native SQL with RANK()
├── security/        JwtAuthFilter (Bearer token extraction), JwtUtil (HS256 sign/verify)
├── service/         AuthService, TournamentService, PointsService, TeamService,
│                    PointsBroadcastService (STOMP broadcasts)
└── util/            SlugUtil (URL-safe slug generation with uniqueness guarantee)
```

**Database** is PostgreSQL managed by Flyway migrations (`src/main/resources/db/migration/`):
- `V1__initial_schema.sql` — core tables
- `V2__add_placement_rules.sql` — placement point rules for Free Fire Squad
- `V3__add_messages.sql` — user messaging
- `V4__add_profile_fields.sql` — gender, game_role, bio on users

## REST API

All controllers are in `Controllers.java`. Auth uses `Authorization: Bearer <jwt>`.

### Roles (least → most privileged)
`PLAYER` → `ORG_HOST` → `ORGANIZER` → `SUPER_ADMIN`

### Auth — `/api/auth` (all public)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | New user with Supabase token + username + gameUid |
| POST | `/api/auth/login` | Login/auto-register with Supabase token |
| POST | `/api/auth/complete-profile` | Set username after OAuth signup |
| POST | `/api/auth/refresh?token=` | Refresh expired access token |
| GET | `/api/auth/me` | Current user (PLAYER+) |

**Auth flow**: Frontend sends Supabase JWT → backend decodes payload (base64, no verify) → finds/creates user → returns 7-day access token + 30-day refresh token.

### Tournaments — `/api/tournaments`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tournaments` | Public | Paginated list; `?status=UPCOMING&page=0&size=20` |
| GET | `/api/tournaments/{slug}` | Public | Single tournament by shareable slug |
| POST | `/api/tournaments` | PLAYER+ | Create tournament |
| PATCH | `/api/tournaments/{id}/status?status=LIVE` | ORGANIZER+ | Advance status (DRAFT→UPCOMING→LIVE→COMPLETED) |
| GET | `/api/tournaments/mine` | PLAYER+ | Tournaments created by current user |
| GET | `/api/tournaments/joined` | PLAYER+ | Tournaments user has a team in |

### Points & Leaderboard
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/leaderboard/{tournamentId}` | Public | Ranked leaderboard with aggregated stats |
| POST | `/api/points/{tournamentId}` | ORGANIZER+ | Record match kills+placement, broadcasts via WS |

### Teams — `/api/teams`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/teams` | PLAYER+ | Register team for tournament (status: PENDING_PAYMENT) |

### Credentials — `/api/credentials`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/credentials/{tournamentId}` | ORGANIZER+ | Push roomId+roomPassword, broadcasts via WS |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/search?q=` | PLAYER+ | Search by username/displayName (max 20, excludes self) |
| GET | `/api/users/conversations` | PLAYER+ | List conversation partners |
| GET | `/api/users/messages/{userId}` | PLAYER+ | Conversation history |
| POST | `/api/users/messages/{userId}` | PLAYER+ | Send message |

### Profile — `/api/profile`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | PLAYER+ | Full profile |
| PUT | `/api/profile` | PLAYER+ | Update username, gameUid, gender, gameRole, bio |

## WebSocket (STOMP)

Endpoint: `/ws` (SockJS). Subscribe prefix `/topic`, send prefix `/app`.

| Topic | Triggered by | Payload |
|---|---|---|
| `/topic/tournament/{id}/leaderboard` | POST /api/points | `List<LeaderboardEntry>` |
| `/topic/tournament/{id}/credentials` | POST /api/credentials | `{ roomId, roomPassword, pushedAt }` |
| `/topic/tournament/{id}/status` | PATCH /api/tournaments/{id}/status | `{ status }` |

## Security

- JWT signed with HMAC-SHA256; subject = user UUID, claim `role` = UserRole name
- `JwtAuthFilter` runs before `UsernamePasswordAuthenticationFilter`
- CSRF disabled (stateless); sessions stateless
- CORS allows `localhost:3000`, `clutchhub-tau.vercel.app`, and `*-yashwanth-1729s-projects.vercel.app`
- `@PreAuthorize` on controller methods for role checks

## Key Domain Concepts

- **Slug**: Unique URL-safe tournament identifier generated from name via `SlugUtil`; used in shareable links as `{TOURNAMENT_LINK_BASE}/{slug}`
- **Points scoring**: `total = kills (kill_points) + placement_points`; placement points looked up from `placement_rules` table seeded for Free Fire Squad (positions 1–12)
- **Organizer subscription**: ₹100/month via Razorpay required to create tournaments (check currently commented out in `TournamentService.create`)
- **Team status**: Starts `PENDING_PAYMENT`; Razorpay webhook confirms → `CONFIRMED`
- **Leaderboard**: Native SQL with `RANK() OVER (ORDER BY totalPoints DESC)`; teams with 0 points included at bottom

## External Integrations

| Service | Purpose |
|---|---|
| Supabase | Authentication (JWT decoded on backend) |
| Firebase Admin SDK | Auth verification (partially deferred) |
| Razorpay 1.4.4 | Entry fees (₹25) and organizer subscriptions (₹100/mo) |
| Cloudinary 1.36.0 | Tournament banners, team logos, certificate PDFs |
| iText7 8.0.3 | PDF certificate generation |
