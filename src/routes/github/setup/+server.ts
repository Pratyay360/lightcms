import { ORPCError } from "@orpc/server";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { githubInstallation } from "$lib/server/db/auth.schema";
import { getGitHubApp } from "$lib/server/github-app";
import { canUserAdministerInstallation, getAccountLogin } from "$lib/server/github-user-access";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.session) throw redirect(302, "/auth");

  const installationId = Number(url.searchParams.get("installation_id"));
  const setupAction = url.searchParams.get("setup_action");
  if (setupAction === "request") {
    throw redirect(303, "/cms");
  }
  try {
    if (!(await canUserAdministerInstallation(locals.session.userId, installationId))) {
      throw new ORPCError(
        "Sign in with the GitHub account that can administer this installation, or re-authenticate your GitHub account.",
      );
    }

    const response = await getGitHubApp().octokit.rest.apps.getInstallation({
      installation_id: installationId,
    });
    const accountLogin = getAccountLogin(response.data.account ?? {});
    if (!accountLogin) {
      throw new ORPCError("The GitHub installation account could not be identified.");
    }

    await db
      .insert(githubInstallation)
      .values({
        userId: locals.session.userId,
        installationId,
        accountLogin,
      })
      .onConflictDoUpdate({
        target: [githubInstallation.userId, githubInstallation.installationId],
        set: { accountLogin },
      });
  } catch (error) {
    if (error instanceof ORPCError) throw error;
    console.error("GitHub setup failed:", error);
    throw new ORPCError(
      "GitHub authentication failed (Bad credentials). Please verify GITHUB_APP_ID, GITHUB_PRIVATE_KEY, or re-login with GitHub.",
    );
  }

  throw redirect(303, "/cms");
};
