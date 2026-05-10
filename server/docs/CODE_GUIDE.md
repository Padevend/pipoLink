# PipoLink Backend Code Guide

## Overview
- Language: TypeScript (strict mode)
- Framework: Hono
- ORM: Prisma (PostgreSQL)
- Realtime: WebSocket (ws)

## Structure
- Controllers: HTTP input/output and validation
- Services: business logic and data persistence
- Middlewares: auth, roles, plan checks
- Validators: VineJS payload validation
- WebSocket: realtime gateway, handlers, DTOs, services

## Response Standard
All HTTP responses follow a standard schema:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": { "timestamp": "2026-05-10T10:00:00.000Z" }
}
```

## Error Handling
- Throw errors with `{ code, status, message, details? }`
- Controllers use `ApiResponse` helper methods
- Validation errors return status 422 with `VALIDATION_ERROR`

## Authentication
- JWT bearer tokens via `Authorization: Bearer <token>`
- `authMiddleware` injects `userId`, `role`, `deviceId`
- `roleMiddleware` restricts to allowed roles
- `planMiddleware` enforces PREMIUM features

## WebSocket Guide
- Endpoint: `/ws`
- Always start with `auth.init` event
- Use `requestId` for client-side request correlation
- Server replies with `system.ack` and may emit async events
- Reconnect flow uses `sync.resume` with `lastEventId`

## Conventions
- Use `camelCase` for variables and methods
- Use `snake_case` only for database fields
- Avoid business logic in controllers
- Keep event handling in websocket handlers

## Adding a New HTTP Endpoint
1. Add route in [start/kernel.ts](../start/kernel.ts)
2. Add controller method
3. Add service logic
4. Add validator
5. Update [docs/ROUTES.md](ROUTES.md) and [openAPI.json](../openAPI.json)

## Adding a New WebSocket Event
1. Add name in [src/modules/websocket/events/event-names.ts](../src/modules/websocket/events/event-names.ts)
2. Add DTO in [src/modules/websocket/dto](../src/modules/websocket/dto)
3. Create handler in [src/modules/websocket/handlers](../src/modules/websocket/handlers)
4. Register in handler index
5. Update [docs/ROUTES.md](ROUTES.md) and [openAPI.json](../openAPI.json)
