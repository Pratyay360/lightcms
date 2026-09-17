import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { auth } from "$lib/server/auth";

const authFormSchema = z.object({
  email: z.string().trim().min(1, "Enter an email address."),
});

function getMagicLinkErrorMessage(cause: unknown): string {
  const fallback = "Failed to send magic link";
  let current: unknown = cause;
  const seen = new Set<unknown>();

  while (current !== null && current !== undefined && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      const detail = extractSmtpDetail(current);
      if (detail) {
        return detail;
      }
      const text = current.message.trim();
      if (text.length > 0 && !isGenericSendFailure(text)) {
        return text;
      }
    }

    if (typeof current === "string") {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !isGenericSendFailure(trimmed)) {
        return trimmed;
      }
    }

    current =
      current instanceof Error && "cause" in current
        ? (current as { cause?: unknown }).cause
        : null;
  }

  if (cause instanceof Error) {
    const text = cause.message.trim();
    if (text.length > 0) {
      return text;
    }
  }

  return fallback;
}

function isGenericSendFailure(text: string): boolean {
  return text.toLowerCase().startsWith("failed to send email to");
}

function extractSmtpDetail(error: Error): string | null {
  const candidate = error as Error & {
    response?: unknown;
    responseCode?: unknown;
  };

  if (typeof candidate.response === "string") {
    const response = candidate.response.trim();
    if (response.length > 0) {
      return response;
    }
  }

  return null;
}

export const load = async () => ({
  form: await superValidate(zod4(authFormSchema), { id: "auth-magic-link" }),
});

export const actions = {
  default: async (event: { request: Request }) => {
    const form = await superValidate(event.request, zod4(authFormSchema), {
      id: "auth-magic-link",
    });

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await auth.api.signInMagicLink({
        body: {
          email: form.data.email,
          callbackURL: "/cms",
          newUserCallbackURL: "/cms",
        },
        headers: event.request.headers,
      });
    } catch (cause) {
      console.error("Failed to send magic link:", cause);
      const errorMessage = getMagicLinkErrorMessage(cause);
      return message(form, errorMessage, { status: 500 });
    }

    return message(form, "Check your inbox for a secure sign-in link.");
  },
};
