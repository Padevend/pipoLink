# API Routes and Realtime Events

## Base URL
`http://localhost:3000`

## Authentication
Use `Authorization: Bearer <token>` for protected routes.

## REST Routes

### Auth
- POST `/auth/register`
  - Body: `{ email, password }`
  - Response 201: `{ success, message, data: { userId } }`

- POST `/auth/verify-otp`
  - Body: `{ email, code, purpose }`
  - Response 200: `{ success, message, data: { accessToken, refreshToken, expiresAt, user } | null }`

- POST `/auth/resend-otp`
  - Body: `{ email, purpose }`
  - Response 200

- POST `/auth/login`
  - Body: `{ email, password }`
  - Response 200: `{ accessToken, refreshToken, expiresAt, user, deviceId }`

- POST `/auth/refresh`
  - Body: `{ refreshToken }`
  - Response 200: `{ accessToken, refreshToken, expiresAt, user, deviceId }`

- POST `/auth/logout` (Auth)
  - Body: `{ refreshToken }`
  - Response 200

- POST `/auth/logout-all` (Auth)
  - Response 200

- POST `/auth/change-password` (Auth)
  - Body: `{ currentPassword, newPassword }`
  - Response 200

- POST `/auth/forgot-password`
  - Body: `{ email }`
  - Response 200

- POST `/auth/reset-password`
  - Body: `{ email, code, newPassword }`
  - Response 200

- GET `/auth/qr/generate` (Auth)
  - Response 200: `{ token, expiresAt }`

- POST `/auth/qr/verify`
  - Body: `{ token, deviceName, platform, fingerprint }`
  - Response 201: `{ accessToken, refreshToken, expiresAt, user, deviceId, device }`

### Users
- GET `/users/me` (Auth)
  - Response 200: profile + subscription + devices

- PUT `/users/me` (Auth)
  - Body: partial profile
  - Response 200

- POST `/users/me/onboarding` (Auth)
  - Body: onboarding fields
  - Response 200

- POST `/users/me/avatar` (Auth, multipart)
  - Body: `file`
  - Response 200: `{ avatarUrl }`

- DELETE `/users/me` (Auth)
  - Response 200

### Devices
- GET `/devices` (Auth)
  - Response 200

- DELETE `/devices/{id}` (Auth)
  - Response 200

### Messaging
- GET `/messaging` (Auth)
  - Response 200: list conversations

- POST `/messaging` (Auth)
  - Body: `{ memberIds: string[] }`
  - Response 201: conversation

- GET `/messaging/{id}/messages` (Auth)
  - Query: `page`, `limit`
  - Response 200: paginated messages

- POST `/messaging/{id}/messages` (Auth)
  - Body: `{ content, iv, type? }`
  - Response 201: message

- POST `/messaging/{id}/messages/upload` (Auth, multipart)
  - Body: `file`
  - Response 201: `{ url, size, fileName, mimeType }`

- POST `/messaging/{id}/read` (Auth)
  - Response 200

### Library
- GET `/library/folders` (Auth)
  - Query: `parentId`

- GET `/library/folders/{id}` (Auth)

- POST `/library/folders` (Auth + Role admin|staff)
  - Body: `{ name, parentId? }`

- DELETE `/library/folders/{id}` (Auth + Role admin)

- GET `/library/documents` (Auth)
  - Query: `folderId`, `type`, `niveau`, `year`, `page`, `limit`

- GET `/library/documents/search` (Auth)
  - Query: `q`

- GET `/library/documents/{id}/download` (Auth)
  - Response: `{ fileUrl }`

- POST `/library/documents` (Auth, multipart)
  - Body: `file` + `payload` JSON string

- PUT `/library/documents/{id}` (Auth)
  - Body: document metadata updates

- DELETE `/library/documents/{id}` (Auth)

- POST `/library/documents/{id}/moderate` (Auth + Role admin|staff)
  - Body: `{ decision, rejectionReason? }`

### AI
- POST `/ai/chat` (Auth)
  - Body: `{ message, sessionId? }`
  - Response 201: `{ session, message }`

- GET `/ai/sessions` (Auth)
  - Response 200

- GET `/ai/sessions/{id}` (Auth)

- DELETE `/ai/sessions` (Auth)

### Subscriptions
- GET `/subscriptions` (Auth)

### Payments
- POST `/payments/initiate` (Auth)
  - Body: `{ amount, provider }`

- POST `/payments/{id}/confirm-simulate` (Auth)

- GET `/payments/{id}/status` (Auth)

### Notifications
- GET `/notifications` (Auth)

- POST `/notifications/mark-all-read` (Auth)

- POST `/notifications/{id}/read` (Auth)

### Announcements
- GET `/announcements` (Auth)

- POST `/announcements` (Auth + Role admin|staff)

### Updates
- GET `/updates`

## WebSocket Events

### Connection
- `auth.init` => authenticate connection
- `auth.refresh` => update token
- `system.ready` => server ready
- `system.ack` => request acknowledgement
- `system.error` => error response
- `system.ping` / `system.pong` => heartbeat
- `sync.resume` => replay missed events by `lastEventId`

### Messaging Flow
- Client `message.send` -> server validates, stores, emits:
  - `message.created`
  - `conversation.updated`
  - `message.delivered` (ack sender)
  - `notification.created` (for other members)

### Events (Server -> Client)
- `message.created`
- `message.updated`
- `message.deleted`
- `message.delivered`
- `message.read`
- `conversation.created`
- `conversation.updated`
- `notification.created`
- `announcement.created`
- `document.uploaded`
- `document.updated`
- `device.linked`
- `device.revoked`
- `subscription.updated`
- `ai.response.created`
- `presence.updated`
- `typing.started`
- `typing.stopped`

### Events (Client -> Server)
- `message.send`
- `message.update`
- `message.delete`
- `message.delivered`
- `message.read`
- `conversation.create`
- `typing.started`
- `typing.stopped`
- `presence.updated`
- `auth.init`
- `auth.refresh`
- `sync.resume`
