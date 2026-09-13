import { type Handle, redirect } from "@sveltejs/kit";
import { building } from "$app/environment";
import { auth } from "$lib/server/auth";

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  if (
    event.url.pathname === "/api/auth/callback/github" &&
    event.url.searchParams.has("installation_id")
  ) {
    const setupUrl = new URL("/github/setup", event.url.origin);
    setupUrl.search = event.url.search;
    throw redirect(302, setupUrl.toString());
  }

  if (!building && event.url.pathname.startsWith("/api/auth")) {
    return auth.handler(event.request);
  }

  if (!building) {
    const sessionData = await auth.api.getSession({
      headers: event.request.headers,
    });

    if (sessionData) {
      if (sessionData.session) {
        event.locals.session = sessionData.session;
      }

      if (sessionData.user) {
        event.locals.user = sessionData.user;
      }
    }
  }

  return resolve(event);
};

export const handle: Handle = handleBetterAuth;

