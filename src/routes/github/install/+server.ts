import { redirect } from "@sveltejs/kit";
import { getGitHubApp } from "$lib/server/github-app";
import { createGitHubInstallState } from "$lib/server/github-install-state";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, locals }) => {
  if (!locals.session) {
    throw redirect(302, "/auth");
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  const state = createGitHubInstallState(locals.session.userId, secret);

  cookies.set("lightcms_github_install_state", state, {
    path: "/github/setup",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
  });

  const installUrl = await getGitHubApp().getInstallationUrl({ state });

  throw redirect(302, installUrl);
};
