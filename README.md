# Zeno

Zeno is a small AI workspace for chat and personal notes. Users sign in with email, chat with an assistant, and can ask the assistant to save, list, search, or delete notes. Notes are scoped per user.

## Features

- Email/password authentication
- Session-based login with secure password hashing
- Chat history per user
- AI assistant powered by the Vercel AI SDK and Google models
- Personal notes saved per user
- Semantic note search using embeddings
- Account deletion that removes the user's account, chats, and notes

## Tech Stack

- Node.js
- Express
- AngularJS
- Angular Route
- jQuery
- Ajax
- Bootstrap CSS
- MongoDB
- bcryptjs
- Vercel AI SDK
- Google Generative AI

## Where Each Stack Is Used

### Node.js

Node.js runs the backend server. The server entrypoint is `src/index.js`, which starts the Express app.

### Express

Express is used to create the backend API and serve the frontend files. The main Express app is defined in `src/app.js`.

Express handles:

- static files from `public/`
- auth routes under `/api/auth`
- chat routes under `/api/chats`
- browser routes like `/login`, `/register`, and `/chat`

### AngularJS

AngularJS is used on the frontend to build the single-page application. The main Angular app is defined in `public/js/app.js`.

AngularJS handles:

- page routing with `ngRoute`
- loading templates without refreshing the browser
- form state for login and register
- chat state and message rendering
- sidebar state
- calling backend APIs through controller functions

### Angular Route

Angular Route is used for frontend routing. It maps browser paths to templates and controllers.

The main frontend routes are:

```text
/login
/register
/chat
/chat/:id
```

Each route loads a template from `public/templates/` and connects it to a controller.

### jQuery

jQuery is used for AJAX requests and simple form value reads.

The `api()` helper in `public/js/app.js` uses `$.ajax()` to call the Express backend. The auth form submit code also uses jQuery to read the actual email and password field values from the submitted form.

### Bootstrap

Bootstrap is mainly used for CSS classes and layout utilities.

Examples include:

- grid classes like `row`, `col-lg-7`, and `col-lg-5`
- spacing classes like `mb-3`, `mb-4`, and `gap-3`
- form classes like `form-control` and `form-label`
- button classes like `btn`, `btn-primary`, and `btn-outline-dark`
- alert classes like `alert` and `alert-danger`

Bootstrap JavaScript is loaded, but the app does not currently depend on Bootstrap JS components.

### MongoDB

MongoDB stores user accounts, chat history, and saved notes. The connection logic is in `src/db/db.js`.

The app uses three collections:

- `users`
- `chats`
- `notes`

### bcryptjs

`bcryptjs` hashes user passwords before storing them in MongoDB. It is used in `src/routes/auth.js`.

### Vercel AI SDK

The Vercel AI SDK is used in `src/lib/ai.js` to generate assistant replies, define AI tools, and create embeddings for semantic note search.

### Google Generative AI

Google models are used as the AI provider through the Vercel AI SDK. The text model generates assistant replies, and the embedding model creates vectors for note search.

## AngularJS Code Summary

The frontend uses AngularJS with `ngRoute` to build a single-page application. The main Angular app is defined in `public/js/app.js`, and it loads different templates without refreshing the page.

The app has four main frontend routes:

```text
/login
/register
/chat
/chat/:id
```

Each route loads a template from `public/templates/` and connects it to a controller.

The main controllers are:

- `AppController`: manages global app state like the current logged-in user, flash messages, logout, account deletion, and whether the top header should show.
- `LoginController`: handles login form data, validation, and login API calls.
- `RegisterController`: handles signup form data, validation, and register API calls.
- `ChatController`: manages chat history, active chat, sending messages, deleting chats, sidebar behavior, and loading messages.

In simple terms, AngularJS controls what the user sees in the browser. It changes views between login, register, and chat, stores form data, responds to button clicks, and updates the page when API responses come back.

The backend is Express, but AngularJS manages the frontend experience. The controllers communicate with the backend using jQuery AJAX requests. This allows the app to update smoothly without reloading the whole page every time the user logs in, registers, opens a chat, sends a message, or deletes a chat.

## Project Structure

```text
src/
  app.js              Express app setup, routes, static assets
  index.js            Server entrypoint
  config.js           Environment configuration
  routes/
    auth.js           Auth, session, account deletion routes
    chats.js          Chat routes
  db/
    db.js             MongoDB connection
    memory.js         User notes and semantic search
  lib/
    ai.js             AI model, tools, and assistant replies

public/
  index.html          App shell
  css/app.css         App styles
  js/app.js           AngularJS client app
  templates/          Login, register, and chat templates
```

## MongoDB Collections

### `users`

Stores user accounts.

```js
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  createdAt: Date
}
```

### `chats`

Stores chat threads for each user.

```js
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  messages: [
    {
      role: "user" | "assistant",
      content: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### `notes`

Stores personal notes for each user. Every note has a `userId`, so users only list, search, and delete their own notes.

```js
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  embedding: Number[],
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000

SESSION_COOKIE_NAME=zeno.sid
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_MAX_AGE_MS=86400000

MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=zeno

GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_MODEL=...
GOOGLE_EMBEDDING_MODEL=...
```

## Installation

This project can be installed with npm or bun. The repository currently includes an npm lockfile.

```sh
npm install
```

Or:

```sh
bun install
```

## Running Locally

Start the development server:

```sh
npm run dev
```

Or with bun:

```sh
bun run dev
```

The app runs on `http://localhost:3000` by default.

For a non-watch server:

```sh
npm start
```

## Build Check

The build script imports the Express app to catch syntax/configuration errors.

```sh
npm run build
```

Or:

```sh
bun run build
```

## Auth Rules

Registration uses email and password.

- Email is validated with a simple email regex.
- Password must include:
  - 8 or more characters
  - one number
  - one uppercase letter
  - one lowercase letter
  - one symbol

Passwords are hashed with `bcryptjs` before storage.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `DELETE /api/auth/account`

### Chats

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:id`
- `POST /api/chats/:id/messages`
- `DELETE /api/chats/:id`

## Notes and Memory

The assistant can use note tools when the user explicitly asks to remember, save, list, show, search, recall, or delete a note. Notes are not stored proactively during casual conversation.

Semantic note search compares the query embedding with stored note embeddings and returns the most relevant notes for the current user.

## Development Notes

- Bootstrap is mainly used for CSS utilities, grid classes, forms, buttons, and alerts.
- jQuery is used for AJAX requests and reading auth form values at submit time.
- Bootstrap JavaScript is loaded, but the app does not currently rely on Bootstrap JS components.
- Chat and note data is always filtered by the authenticated user's `userId`.
