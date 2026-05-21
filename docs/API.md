# Omega API Reference

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/auth/refresh` | No | Rotate refresh token |
| POST | `/api/auth/logout` | No | Sign out (idempotent) |
| GET | `/api/auth/me` | No | Get current user from token |

#### POST /api/auth/register

```json
{
  "name": "Sai Sankeerth",
  "email": "sai@example.com",
  "password": "SecurePass1!"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "sai@example.com", "name": "Sai Sankeerth", "avatarUrl": null },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/login

```json
{
  "email": "sai@example.com",
  "password": "SecurePass1!"
}
```

#### POST /api/auth/refresh

```json
{
  "refreshToken": "eyJ..."
}
```

### User Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Yes | Get current user profile |
| GET | `/api/users/:id` | No | Get user by ID |

### Project Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | Yes | List user's projects (paginated) |
| GET | `/api/projects/:id` | Yes | Get single project |
| POST | `/api/projects` | Yes | Create project |
| PUT | `/api/projects/:id` | Yes | Update project |
| DELETE | `/api/projects/:id` | Yes | Delete project |

Query params for listing: `?page=1&limit=20`

#### POST /api/projects

```json
{
  "name": "Q4 Pitch Deck",
  "description": "Our quarterly investor update",
  "type": "presentation"
}
```

Types: `presentation`, `website`, `document`, `story`

### Template Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | No | List public templates (paginated) |
| GET | `/api/templates/:id` | No | Get single template |
| POST | `/api/templates` | Yes | Create template |
| POST | `/api/templates/seed` | No | Seed default templates |

Query params: `?page=1&limit=20&category=Presentations`

### Editor Document Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/editor/:projectId` | Yes | Get editor document for project |
| PUT | `/api/editor/:projectId` | Yes | Update editor document |

#### PUT /api/editor/:projectId

```json
{
  "content": {
    "blocks": [
      { "id": "block-1", "type": "heading", "content": "Hello World" },
      { "id": "block-2", "type": "text", "content": "Some text here" }
    ]
  },
  "version": 1
}
```

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check + DB status |

## WebSocket Events

Connect at `ws://localhost:3001` with auth:

```js
const socket = io('ws://localhost:3001', {
  auth: { token: 'your-access-token' }
});
```

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:project` | Client → Server | `projectId: string` |
| `leave:project` | Client → Server | `projectId: string` |
| `cursor:move` | Client → Server | `{ projectId, position: { x, y } }` |
| `document:change` | Client → Server | `{ projectId, blocks }` |
| `selection:change` | Client → Server | `{ projectId, blockId }` |
| `user:joined` | Server → Client | `{ userId, email, socketId }` |
| `user:left` | Server → Client | `{ userId, socketId }` |
| `cursor:moved` | Server → Client | `{ userId, email, socketId, position }` |
| `document:updated` | Server → Client | `{ userId, blocks }` |
| `selection:updated` | Server → Client | `{ userId, blockId }` |
| `room:collaborators` | Server → Client | `Collaborator[]` |

## Error Responses

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "error": "Human-readable message",
  "details": {}
}
```

### Error Codes

- `VALIDATION_ERROR` (422)
- `NOT_FOUND` (404)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `CONFLICT` (409)
- `BAD_REQUEST` (400)
- `TOO_MANY_REQUESTS` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)
- `TOKEN_EXPIRED` (401)
- `EMAIL_EXISTS` (409)
