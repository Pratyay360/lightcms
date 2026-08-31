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

function requireEnv(name: string): string {
  const value = (dynamicEnv as Record<string, string | undefined>)[name] ?? process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function createAuth() {
  return betterAuth({
    appName: "LightCMS",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    baseURL: requireEnv("BETTER_AUTH_URL"),
    secret: requireEnv("BETTER_AUTH_SECRET"),
    account: {
      storeStateStrategy: "database",
    },

    advanced: {
      trustedProxyHeaders: true,
    },

    socialProviders: {
      github: {
        clientId: requireEnv("GITHUB_CLIENT_ID"),
        clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
      },
    },

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
