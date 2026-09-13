import { type Handle, redirect } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/env";
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
  if (!building && !event.url.pathname.startsWith("/api/auth")) {
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

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
