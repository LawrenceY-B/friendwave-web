# Friendwave Web

The Next.js frontend for Friendwave. It talks to the
[Friendwave API](../../BackendProjects/Friendwave) (`docs/API.md` there) and logs users in with Auth0.

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, `@auth0/nextjs-auth0` v4, pnpm.

## Run it

1. Start the API first (in `BackendProjects/Friendwave`): `npm run dev` → `http://localhost:4000`
2. Here:
   ```bash
   pnpm install
   cp .env.example .env.local   # then fill in AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET, and AUTH0_SECRET (openssl rand -hex 32)
   pnpm dev                     # http://localhost:3000
   ```

The Auth0 application must be a **Regular Web Application**, with:
- Allowed Callback URLs `http://localhost:3000/auth/callback`
- Allowed Logout URLs `http://localhost:3000`
- User access to **Friendwave API** authorized (APIs → Friendwave API → Application Access)

## How it fits together

```
Browser ──▶ Next.js server ──(Bearer access token)──▶ Friendwave API
              │
              └─ proxy.ts: /auth/login, /auth/logout, /auth/callback (Auth0 SDK)
```

- **Pages fetch on the server.** They're Server Components that call the API through
  `src/lib/api.ts` (`api()` for one object, `apiPage()` for lists with `nextCursor`).
- **Live chat is the exception: it connects from the browser.** `src/lib/socket.ts` gets a token with
  the SDK's client `getAccessToken()` (served by `/auth/access-token`) and opens a socket.io connection
  to the API. A fresh token is fetched on every reconnect.
- **Mutations** (like, follow) are Server Actions in `src/lib/actions.ts`, called from small Client
  Components that update instantly (optimistic UI).
- **Cache Components** is on, so anything that reads the session renders inside `<Suspense>`. The
  rest of the page is a static shell that loads instantly. See `src/app/layout.tsx` and `src/app/page.tsx`.
- **Types come from the API.** `src/lib/api-types.ts` is generated from the API's OpenAPI spec, and
  `src/interfaces/api.ts` gives the types short names. Regenerate after API changes (with the API running):
  ```bash
  pnpm gen:api
  ```

## Structure

```
src/
  app/            pages: / (landing or feed), /posts/new, /posts/[id], /users/[id], /chats, /chats/[id], error + not-found
  components/     avatar, post card, new-post form, comments, like/follow buttons, chat room, user menu, skeletons
  interfaces/     API types (aliases over the generated file)
  lib/            auth0 client, API helper, server actions, socket, upload limits, formatting
  proxy.ts        Auth0 routes + session refresh
```

## Scripts

| | |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (sorts imports and Tailwind classes) |
| `pnpm gen:api` | regenerate API types |

## Live chat (`src/components/chat-room.tsx`)

- The page loads the chat and its latest 30 messages on the server, then the browser keeps them live.
- **Sending** shows the message immediately ("Sending…"), sends it over the socket and swaps in the saved
  message from the server's acknowledgement. If the socket is down, it sends over HTTP instead.
- **No duplicates:** a message can arrive both as the acknowledgement and as the live `message:new`
  event, so every update goes through one `upsert` keyed by message id.
- **Reconnects:** after a drop, it fetches the latest page to catch up on anything missed.
- Delete your own messages (hover). Edits and deletes made elsewhere show up live.

## Posting and comments

- **`/posts/new`** (the ＋ in the header): pick up to 10 photos (5 MB each), with previews and remove buttons,
  plus a caption. Wrong types and oversized files are skipped with a message before anything uploads.
  The form uses `useActionState` with the `createPost` Server Action, which forwards the photos to the API
  and opens the new post.
- **Upload size:** `next.config.ts` raises two limits to 52 MB. Server Actions accept 1 MB by default,
  and `proxy.ts` buffers only 10 MB of a request body by default. **The proxy limit cuts larger bodies off
  silently**, which would corrupt bigger uploads.
- **`/posts/[id]`**: the post, comments (newest first, "Load older comments"), replies, and deleting.
  Delete buttons show only where the API allows it: your own comments and replies, every comment on your
  own posts, and replies on your own comments. Each change is a Server Action that re-renders the page in
  the same round trip.

## Next up

Stories and profile editing. The API already supports both.
