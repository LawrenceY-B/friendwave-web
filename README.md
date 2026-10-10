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
  app/            pages: / (landing or feed), /create, /posts/[id] (+ @modal overlay), /users/[id], /settings/profile, /chats, /chats/[id], error + not-found
  components/     avatar, post card, new-post form, edit-profile form, comments, like/follow buttons, chat room, user menu, skeletons
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

`NEXT_DIST_DIR=.next-test pnpm build` builds a separate copy (used by tests, so they never touch `.next`).

## Live chat (`src/components/chat-room.tsx`)

- The page loads the chat and its latest 30 messages on the server, then the browser keeps them live.
- **Sending** shows the message immediately ("Sending…"), sends it over the socket and swaps in the saved
  message from the server's acknowledgement. If the socket is down, it sends over HTTP instead.
- **No duplicates:** a message can arrive both as the acknowledgement and as the live `message:new`
  event, so every update goes through one `upsert` keyed by message id.
- **Reconnects:** after a drop, it fetches the latest page to catch up on anything missed.
- Delete your own messages (hover). Edits and deletes made elsewhere show up live.

## Look and feel (Instagram-style)

- **Posts open on top of the page you're on** (`app/@modal/(.)posts/[id]`, Next.js intercepting +
  parallel routes). The URL changes, so a post can be shared; ✕, Esc, clicking outside or Back closes it.
  Opening `/posts/:id` directly (a shared link or a refresh) shows the full page, with a back button.
- **Menus are sheets** (`components/sheet.tsx`, a native `<dialog>`): they slide up from the bottom on phones
  (swipe down to close) and appear centred on larger screens. Examples: the ⋮ on a post (your posts: Add to your
  story, Delete post with a second tap to confirm; others: Copy link, Go to profile), and "Following ▾" on a profile
  (Unfollow; Close Friends, Favourites, Mute and Restrict are marked *Coming soon*).
- **Photos:** swipe, or use ‹ ›, with dots showing which photo you're on (`components/post-images.tsx`).
- **Phones get a bottom tab bar** (`components/bottom-nav.tsx`): Feed, Search, New post and Chats in a floating
  "liquid glass" pill (translucent, blurs and tints from what scrolls behind it; a glass lens marks the current tab).
  It goes solid if "Reduce transparency" is on, and hides inside a conversation and in the story viewer. From `sm:` up
  these icons stay in the header.
- **Share anyone's post to your story** from its ⋮ menu; the story viewer credits the original poster ("from @bob").
- **Less text:** likes and comments are just numbers next to icons (screen readers still hear "3 likes"); the header is
  icons only (each has a tooltip and a screen-reader name).
- **Profile:** a story ring on the picture when they have a live story, tappable follower/following counts that
  open lists, and a Following ▾ / Message button row.

## Posting and comments

- **`/create`** (the ＋ in the header; not under /posts/, where it would clash with the post overlay route): pick up to 10 photos (5 MB each), with previews and remove buttons,
  plus a caption. Wrong types and oversized files are skipped with a message before anything uploads.
  The form uses `useActionState` with the `createPost` Server Action, which forwards the photos to the API
  and returns you to the feed, where the new post is first.
- **Uploads:** photos are shrunk in the browser first (`lib/resize-image.ts`: at most 1080px, JPEG; a 22 MB
  camera photo becomes ~600 KB), then sent **straight from the browser to the API** with a progress bar
  (`lib/upload.ts`). They don't pass through Next's server, because on Vercel every request to it is capped at
  **4.5 MB**. Profile pictures are shrunk to 640px (~100 KB) and still go through a Server Action.
- **Comments** (in the post overlay or page): newest first, "Load older comments", replies, and deleting. The send icon
  sits inside the input; Enter does the same.
  Delete buttons show only where the API allows it: your own comments and replies, every comment on your
  own posts, and replies on your own comments. Each change is a Server Action that re-renders the page in
  the same round trip.

## Profile editing (`/settings/profile`)

"Edit profile" on your own profile. Change your picture (with preview), name, username and bio. Only
changed fields are sent, and Save stays disabled until something changes. Usernames are checked in the
browser (3-30 letters, numbers, `.` or `_`) and by the API, which answers "Username already taken"
(ignoring case). After saving, the whole layout is revalidated, so the header's picture and name update too.

## Search and stories

- **`/search`** (magnifier in the header): results as you type, with Follow / Following on each person.
- **Stories:** a bar at the top of the feed (yours first, then people you follow). The full-screen viewer
  auto-advances every 5s; tap the left/right, or use ←/→, to move; hold to pause; Esc to close. Rings turn
  grey once seen (remembered in this browser). "Add to your story" is on your posts; delete from the viewer.
- **Pages are kept alive:** Next.js keeps visited pages alive in the background (React `<Activity>`), so
  components that must start fresh reset themselves when hidden: the story viewer, the new-post form after
  a successful post, and the chat room (which catches up on missed messages when it reconnects).
