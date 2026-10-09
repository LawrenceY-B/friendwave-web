"use client";

import { getAccessToken } from "@auth0/nextjs-auth0";
import { io } from "socket.io-client";

// Opens a live connection to the Friendwave API.
// The socket connects from the browser, so it needs an access token here: the SDK's
// getAccessToken() fetches it from /auth/access-token. `auth` is a function, so a
// fresh token is fetched on every (re)connect: an expired token can't strand the socket.
export function connectSocket() {
  return io(process.env.NEXT_PUBLIC_API_URL, {
    auth: (callback) => {
      getAccessToken()
        .then((token) => callback({ token }))
        .catch(() => callback({}));
    },
  });
}
