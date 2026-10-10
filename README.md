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
- **Live updates are the exception: they come straight to the browser.** One socket.io connection per tab
  (`components/realtime-provider.tsx`, in the layout) is opened when you're logged in. `src/lib/socket.ts`
  gets a token with the SDK's client `getAccessToken()` (served by `/auth/access-token`) and fetches a fresh
  one on every reconnect. Components use the provider's hooks: `useSocketEvent(event, handler)`,
  `useWatchPosts(ids)` (subscribe to the posts on screen) and `usePresence(userIds)`.
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

## Live updates

- **Likes and comment counts** change on screen as other people like and comment (`components/post-live.tsx`
  holds each post's like state, shared by the heart button, double tap and the comment count).
- **Comments and replies** from others appear (and disappear) while a post is open, without duplicates.
- **"↑ New posts"** shows on the feed when someone you follow posts; tap it to load them.
- **Notifications** (`/notifications`, the bell in the header): follows, likes, comments, replies and story
  shares. The red dot appears live; opening the page marks everything read. It shows the latest 10;
  "See all" (then "See more") loads 10 more at a time.
- **Online:** a green dot on the picture in the chat list and the chat header when the other person has the
  app open.

## Motion (GSAP + Lenis)

- **Smooth scrolling:** Lenis (`components/smooth-scroll.tsx`) eases mouse-wheel and trackpad scrolling,
  driven by GSAP's clock so scroll-linked animations stay in step. Touch screens keep native scrolling.
  Overlays and menus freeze the page behind them with `useScrollLock()`. Inner scroll areas opt out with
  `data-lenis-prevent`; sideways carousels with `data-lenis-prevent-horizontal`.
- **Double tap:** a gradient heart springs in where you tapped, with a shockwave ring and flying hearts
  (`lib/like-burst.ts`). The heart button jumps and sparks; like and comment counts roll like an odometer.
- **Everywhere else** (`components/motion-effects.tsx` and the components themselves):
  - anything marked `data-reveal` slides in the first time it scrolls into view, including rows that
    arrive live
  - pages cross-fade
  - the header hides while you scroll down and returns when you scroll up
  - feed photos drift slightly as they pass (parallax)
  - the post overlay zooms in and out
  - menus spring up
  - the bell rings when something new arrives
  - "New posts" bounces in
  - the bottom bar's glass lens glides between tabs
  - unseen story rings spin
  - stories open like a portal and swing between posts in 3D
- **Reduced motion:** with "Reduce motion" on in the device settings, all of this is off (no smooth
  scrolling, nothing hidden waiting to animate). Import GSAP from `@/lib/motion`, which registers the
  plugins and exports `reducedMotion()`.

## Live chat (`src/components/chat-room.tsx`)

- The page loads the chat and its latest 30 messages on the server, then the browser keeps them live.
- **Sending** shows the message immediately ("Sending…"), sends it over the socket and swaps in the saved
  message from the server's acknowledgement. If the socket is down, it sends over HTTP instead.
- **No duplicates:** a message can arrive both as the acknowledgement and as the live `message:new`
  event, so every update goes through one `upsert` keyed by message id.
- **Reconnects:** after a drop, it fetches the latest page to catch up on anything missed.
- Delete your own messages (hover). Edits and deletes made elsewhere show up live.
- **Look (Telegram-style), full screen:**
  - **Screen:** a plain light or dark background, following the theme (`.chat-wallpaper` in `globals.css`). Floating glass pills
    sit on top: back, then name + status ("online", "last seen recently", or "Reconnecting…"), then their picture.
  - **Bubbles:**
    - yours on the right in light blue, theirs on the left in white
    - grouped when the same person sends within 5 minutes, with a tail on the last bubble of each group
    - the time and a tick (a clock while sending, ✓ once sent) inside the bubble
  - **Emoji-only messages** (1–3 emoji) show big, without a bubble.
  - **Date pills:** "Today", "Yesterday" or a date. They're rendered after hydration because they depend on
    your timezone.
  - **Jump button:** while you're scrolled up, new messages don't pull you down. A ⌄ button counts them
    and jumps to the latest.

## Look and feel (Instagram-style)

- **Posts open on top of the page you're on** (`app/@modal/(.)posts/[id]`, Next.js intercepting +
  parallel routes). The URL changes, so a post can be shared; ✕, Esc, clicking outside or Back closes it.
  Opening `/posts/:id` directly (a shared link or a refresh) shows the full page, with a back button.
- **Menus are sheets** (`components/sheet.tsx`, a native `<dialog>`): they slide up from the bottom on phones
  (swipe down to close) and appear centred on larger screens. Examples: the ⋮ on a post (your posts: Add to your
  story, Delete post with a second tap to confirm; others: Copy link, Go to profile), and "Following ▾" on a profile
  (Unfollow; Close Friends, Favourites, Mute and Restrict are marked *Coming soon*).
- **Photos:** swipe, or use ‹ ›, with dots showing which photo you're on (`components/post-images.tsx`).
  In the feed they run edge to edge across the centred column, with square corners. The header and the
  likes/caption rows are padded instead.
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
  With nothing typed it shows **Recent** (people you opened from search, remembered in this browser) and
  **Suggested for you**: people followed by people you follow ("Followed by bob and 2 others"). An empty
  feed shows the same suggestions.
- **Double tap a photo to like** it (a heart pops). It only likes, never unlikes; swipes don't count.
- **Stories:** a bar at the top of the feed (yours first, then people you follow). The full-screen viewer
  auto-advances every 5s; tap the left/right, or use ←/→, to move; hold to pause; Esc to close. Rings turn
  grey once seen (remembered in this browser). "Add to your story" is on your posts; delete from the viewer.
  Tap the post in a story for **See post**: the story pauses and the post opens on top; close it to carry on.
- **Back buttons** (`components/navigation-tracker.tsx`, `useBack`): go back if you came from another page
  in the app; otherwise (opened from a link, or after a refresh) go to a sensible page, usually the feed.
- **Pages are kept alive:** Next.js keeps visited pages alive in the background (React `<Activity>`), so
  components that must start fresh reset themselves when hidden: the story viewer, the new-post form after
  a successful post, and the chat room (which catches up on missed messages when it reconnects).

## Deploying on Vercel

1. Vercel → **Add New → Project** → import `LawrenceY-B/friendwave-web` (Next.js and pnpm are detected).
2. **Environment variables** (Production):

   | Variable | Value |
   |---|---|
   | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | the Friendwave Web app in Auth0 |
   | `AUTH0_SECRET` | a new one: `openssl rand -hex 32` |
   | `APP_BASE_URL` | `https://<your-app>.vercel.app` |
   | `AUTH0_AUDIENCE` | `https://api.friendwave` |
   | `API_URL`, `NEXT_PUBLIC_API_URL` | your Render URL, e.g. `https://friendwave-api.onrender.com` |

   `NEXT_PUBLIC_API_URL` is built into the browser code, so **redeploy** after changing it.
3. **Auth0 → Friendwave Web → Settings:** add `https://<your-app>.vercel.app/auth/callback` to Allowed Callback
   URLs, and `https://<your-app>.vercel.app` to Allowed Logout URLs and Allowed Web Origins.
4. **Render:** set the API's `CLIENT_ORIGIN` to `https://<your-app>.vercel.app`.
5. **Region:** `vercel.json` pins the functions to `iad1` (Washington, D.C. / AWS us-east-1), next to the API on
   Render (`virginia`) and MongoDB Atlas (us-east-1). Every page calls the API from the server, so keeping them
   together keeps pages fast.

Preview deployments (per branch) get their own URLs; Auth0 callbacks and the API's `CLIENT_ORIGIN` only allow
the production URL for now.
