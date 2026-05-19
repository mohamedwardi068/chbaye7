# chbaye7 — Ghost Ride

A ghost-themed mobile ride-hailing MVP. Riders summon phantom drivers; drivers accept/reject dispatched ride requests in real-time via Socket.io.

## Run & Operate

- `pnpm --filter @workspace/backend run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/frontend run dev` — run the Expo app (web preview + Expo Go QR)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Socket.io 4 + Mongoose 8 (MongoDB)
- Mobile: Expo (React Native) + expo-router + React Query
- Auth: JWT (jsonwebtoken + bcryptjs), stored in AsyncStorage
- UI: expo-linear-gradient, react-native-reanimated, @expo/vector-icons (MaterialCommunityIcons)
- API codegen: Orval (from OpenAPI spec in lib/api-spec)

## Where things live

- `backend/src/` — Express backend
  - `models/` — Mongoose User + Ride schemas
  - `controllers/` — authController, rideController
  - `middlewares/auth.ts` — JWT verify middleware
  - `sockets/index.ts` — Socket.io event handlers (driver dispatch, race-condition-safe accept)
  - `routes/` — auth, rides, health
- `frontend/` — Expo mobile app
  - `app/(auth)/` — login + register screens
  - `app/(rider)/` — rider home (request ride) + ride (active ride status)
  - `app/(driver)/` — driver dashboard (online toggle, incoming requests, active ride controls)
  - `context/AuthContext.tsx` — JWT auth state + AsyncStorage persistence
  - `context/SocketContext.tsx` — Socket.io client state (online status, pending requests, ride updates)
  - `components/` — GhostButton, GlowCard, StatusBadge, ErrorBoundary
  - `hooks/useColors.ts` — dark/light color palette hook
- `lib/api-client-react/` — generated React Query hooks (useLogin, useRegister, useCreateRide, useGetActiveRide)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)

## Architecture decisions

- **Broadcast dispatch**: When a ride is created, the server emits `ride:new` to all drivers in the "drivers" room. First driver to emit `ride:accept` wins via Mongoose `findOneAndUpdate` with `{ driverId: null, status: 'searching' }` condition — prevents double-acceptance.
- **No maps, no payments**: MVP scope. Locations are free-text strings.
- **Socket.io over `/api/socket.io` path**: All traffic (REST + WS) goes through the shared Replit proxy at the top level. Socket.io uses a custom path to route through `/api`.
- **JWT in AsyncStorage**: Standard Expo pattern. Token is injected into every API request via `setAuthTokenGetter` from the api-client-react lib.
- **Dark-only UI**: Ghost theme — #0A0A0A background, #00D4FF neon cyan primary, #0050FF accent.

## Product

- **Riders** register/login, enter pickup + destination, summon a driver. Track status in real-time (searching → accepted → arrived → started → completed).
- **Drivers** register/login, toggle online/offline, see incoming ride requests broadcast to all online drivers, accept or reject each, update ride status with tap.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Socket.io path must be `/api/socket.io` on both server and client to route through the shared proxy.
- `pnpm --filter @workspace/backend run typecheck` (not build) to verify TS — build needs workflow-provided PORT/BASE_PATH.
- After schema or API spec changes: run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks.
- MongoDB Atlas: ensure the DB user has readWrite access to the target database in the URI.
