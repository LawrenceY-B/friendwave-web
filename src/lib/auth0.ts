import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET and APP_BASE_URL from .env.local
export const auth0 = new Auth0Client({
  authorizationParameters: {
    // Ask Auth0 for an access token for the Friendwave API, not just an ID token
    audience: process.env.AUTH0_AUDIENCE,
    // profile + email let the API fill in name/email/picture when it creates a new user
    scope: "openid profile email",
  },
});
