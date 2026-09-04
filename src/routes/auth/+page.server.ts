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
  if (cause instanceof Error) {
    const message = cause.message.trim();
    if (message.length > 0) {
      return message;
    }
    return fallback;
  }
  if (typeof cause === "string") {
    const trimmed = cause.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    return fallback;
  }
  return fallback;
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
      const errorMessage = getMagicLinkErrorMessage(cause);
      throw new Error(errorMessage, { cause });
    }

    return message(form, "Check your inbox for a secure sign-in link.");
  },
};
