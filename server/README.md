# PipoLink Backend

This is the backend service for PipoLink, a secure, offline-first student platform.
Built with Node.js, Hono, Prisma (PostgreSQL), and TypeScript.

## Setup

1. Copy `.env.example` to `.env` and fill the variables.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run db:generate`
4. Run migrations: `npm run db:migrate`
5. Seed database: `npx tsx prisma/seed.ts`
6. Start dev server: `npm run dev`

## Architecture
- **Controllers**: Handle HTTP input/output and validation.
- **Services**: Contain all business logic and database interactions.
- **Middlewares**: Protect routes (Auth, Roles, Premium).
- **Prisma**: ORM for PostgreSQL.
- **WebSocket**: Realtime gateway and event handlers.

## Features
- E2E Encrypted Messaging (backend stores opaque ciphertexts)
- Document Library with Sharp image processing
- Role-based Access Control (Admin, Staff, Student)
- JWT Authentication & Device Management
- OTP via Email

## Documentation
- [Code Guide](docs/CODE_GUIDE.md)
- [Routes and Realtime Events](docs/ROUTES.md)
- [OpenAPI Spec](openAPI.json)
