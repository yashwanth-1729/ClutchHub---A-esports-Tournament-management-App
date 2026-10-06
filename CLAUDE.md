# CLAUDE.md

The Spring Boot backend that used to live here has been removed. ClutchHub now runs
entirely on Supabase (Postgres + RLS + RPC + Realtime + Storage + Edge Functions) and is
consumed directly by the Next.js app in `yashwanth-1729/ClutchHub-frontend`.

See that repository for the schema (`supabase/migrations/`), data layer
(`src/lib/data.ts`) and auth flow. This repository intentionally contains no application code.
