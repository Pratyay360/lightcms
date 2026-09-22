import type { Context } from "probot";

type InstallationPayload = Context<"installation">["payload"];

/**
 * Resolve a human-readable login for the account that installed the app.
 * Returns `undefined` when GitHub omits every identifier instead of
 * falling back to an empty string that would break Octokit calls.
 */
function resolveAccountLogin(payload: InstallationPayload): string | undefined {
  const account = payload.installation?.account;

  if (account !== undefined && account !== null && "login" in account) {
    const login = account.login;
    if (typeof login === "string" && login.length > 0) {
      return login;
    }
  }

  if (account !== undefined && account !== null && "slug" in account) {
    const slug = account.slug;
    if (typeof slug === "string" && slug.length > 0) {
      return slug;
    }
  }

  const senderLogin = payload.sender?.login;
  if (typeof senderLogin === "string" && senderLogin.length > 0) {
    return senderLogin;
  }

  return undefined;
}

/**
 * Handle installation lifecycle events.
 *
 * The handler records installs and uninstalls. It deliberately creates
 * no issues or comments: GitHub rejects empty issue bodies, and opening
 * issues on every install is spammy for repositories the app was just
 * granted access to.
 */
export async function handleInstallation(context: Context<"installation">): Promise<void> {
  const { payload, log } = context;
  const accountLogin = resolveAccountLogin(payload);
  const repositoryCount = payload.repositories?.length ?? 0;

  if (payload.action === "created") {
    log.info(
      {
        account: accountLogin,
        repositories: repositoryCount,
      },
      "LightCMS bot installed",
    );
    return;
  }

  if (payload.action === "deleted") {
    log.info(
      {
        account: accountLogin,
      },
      "LightCMS bot uninstalled",
    );
    return;
  }

  log.debug({ action: payload.action }, "Ignoring unsupported installation action");
}
