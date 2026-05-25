# API Endpoints Documentation (Postman Guide)

This document contains all the available endpoints in the MSC Desamparados API (`/api/v1`). You can use this guide to configure your requests in Postman.

## Base URL
`http://localhost:3000/api/v1`

## Authentication (`/auth`)

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `POST` | `/auth/register` | Register a new user | No | `{ fullName, email, password, phone, nationalId, roleId }` |
| `POST` | `/auth/login` | Login user | No | `{ email, password }` |
| `POST` | `/auth/logout` | Logout user | Yes | None |
| `POST` | `/auth/recover-password` | Password recovery | No | `{ email }` |
| `GET`  | `/auth/check-status` | Check if token is valid | Yes | None |

## Users (`/users`)
*Requires Admin or Funcionario roles.*

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/users` | Get all users | Yes | None |
| `POST` | `/users` | Create a new user | Yes | `{ fullName, email, password, phone, nationalId, roleId }` |
| `PUT`  | `/users/:id` | Update user by ID | Yes | `{ fullName, email, phone, roleId }` |
| `DELETE` | `/users/:id` | Delete user by ID | Yes | None |

## Reports (`/reports`)

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/reports` | Get all reports (with pagination/filters) | Yes | Query: `?status=Pendiente&tipo=Robo&search=auto&page=1&limit=10` |
| `POST` | `/reports` | Create a new report | Yes | `{ tipo, descripcion, distrito, barrio, direccion_exacta, fecha, id_creador, estado, lat, lng, imageUrl }` |
| `POST` | `/reports/upload` | Upload report evidence image | Yes | `multipart/form-data` with key `image` (Returns `{ imageUrl }`) |
| `PUT`  | `/reports/:id` | Update report status | Yes | `{ estado: 'En Proceso' }` |
| `DELETE` | `/reports/:id` | Delete report by ID | Yes | None |

## Consults (`/consults`)

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/consults` | Get all consults | Yes | Query: `?status=Pendiente` |
| `POST` | `/consults` | Create a consult | Yes | `{ cedula, nombreCompleto, correo, telefono, tipoConsulta, descripcion }` |
| `PUT`  | `/consults/:id` | Update consult response | Yes | `{ respuesta: '...', estado: 'Resuelto' }` |
| `DELETE` | `/consults/:id` | Delete consult by ID | Yes | None |

## Patrols (`/patrols`)
*Requires Admin or Funcionario roles.*

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/patrols` | Get patrol history | Yes | None |
| `POST` | `/patrols` | Start/Log a new patrol | Yes | `{ startLat, startLng, startTime, officerId }` |
| `PUT`  | `/patrols/:id` | Update patrol status | Yes | `{ endLat, endLng, endTime, status }` |

## Profile (`/profile`)

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/profile` | Get current user profile | Yes | None |
| `PUT`  | `/profile` | Update user profile info | Yes | `{ fullName, email, phone }` |
| `PUT`  | `/profile/photo` | Update profile photo URL | Yes | `{ profilePhoto }` |
| `POST` | `/profile/photo/upload`| Upload profile photo | Yes | `multipart/form-data` with key `avatar` |

## Police IA (`/police-ia`)

| Method | Endpoint | Description | Requires Auth | Body / Params |
|--------|----------|-------------|---------------|---------------|
| `GET`  | `/police-ia/analyze` | Start AI analysis | Yes | `{ reportId, query }` |
| `POST` | `/police-ia/chat` | Chat with Police AI | Yes | `{ message, history }` |

## Notes for Postman configuration:
1. **Authentication**: After calling `POST /auth/login`, the API typically sets a cookie with the JWT token. Ensure Postman is configured to store and send cookies for `localhost`. If using Bearer tokens in headers, add `Authorization: Bearer <token>`.
2. **File Uploads**: For `/reports/upload` and `/profile/photo/upload`, use the `Body` -> `form-data` tab in Postman. Create a key (e.g., `image`), set the type from `Text` to `File`, and select an image file.
