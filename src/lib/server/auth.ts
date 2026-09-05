import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { env as dynamicEnv } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { sendMail } from "$lib/utils/mail";

function getEnv(name: string): string | undefined {
  const fromDynamic = (dynamicEnv as Record<string, string | undefined>)[name];
  if (fromDynamic) return fromDynamic;
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromMeta) return fromMeta;
  return undefined;
}

function createAuth() {
  const betterAuthUrl = getEnv("BETTER_AUTH_URL");
  const betterAuthSecret = getEnv("BETTER_AUTH_SECRET");
  const githubClientId = getEnv("GITHUB_CLIENT_ID");
  const githubClientSecret = getEnv("GITHUB_CLIENT_SECRET");

  return betterAuth({
    appName: "LightCMS",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    ...(betterAuthUrl ? { baseURL: betterAuthUrl } : {}),
    secret: betterAuthSecret,
    account: {
      storeStateStrategy: "database",
    },

    advanced: {
      trustedProxyHeaders: true,
    },

    socialProviders:
      githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {},

    plugins: [
      magicLink({
        expiresIn: 60 * 10,
        async sendMagicLink({ email, url }) {
          try {
            await sendMail({
              to: email,
              subject: "Sign in to LightCMS",
              text: `Use this secure link to sign in to LightCMS: ${url}\n\nThis link expires in 10 minutes.`,
              html: `
							<p>Use this secure link to sign in to LightCMS:</p>
							<p><a href="${url}">Sign in to LightCMS</a></p>
							<p>This link expires in 10 minutes.</p>
						`,
            });
          } catch (error) {
            console.error(`[auth:magicLink] failed to send to ${email}:`, error);
            throw error;
          }
        },
      }),

      passkey({
        rpName: "LightCMS",
      }),

      sveltekitCookies(() => getRequestEvent()),
    ],
  });
}

export const auth = createAuth();
