<script lang="ts">
  import { SITE } from "$lib/seo";

  // Bump this manually whenever the policy text below changes — do not derive
  // it from `Date.now()`, since this page is prerendered at build time and
  // that would silently claim an "update" on every unrelated deploy.
  const LAST_UPDATED = "September 29, 2026";
</script>

<section class="mx-auto max-w-3xl px-4 py-8 sm:py-12" aria-labelledby="privacy-title">
  <p class="eyebrow font-semibold text-primary">Legal</p>

  <article
    class="mt-6 space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground leading-7 shadow-xs sm:p-8"
  >
    <header class="space-y-2">
      <h1 id="privacy-title" class="text-2xl font-bold tracking-tight sm:text-3xl">
        Privacy Policy
      </h1>
      <p class="text-sm text-muted-foreground">
        Last updated: <span class="font-medium">{LAST_UPDATED}</span>
      </p>
    </header>

    <p>
      LightCMS is an open-source, Git-backed CMS. Its source is public on
      <a
        href={SITE.repository}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline hover:text-primary/80"
      >
        GitHub
      </a>
      and anyone can self-host it. This policy covers the instance running at
      <span class="font-medium">{SITE.origin}</span>; if you use a self-hosted deployment, that
      operator's own policy applies instead.
    </p>

    <section>
      <h2 class="text-lg font-semibold">1. Information We Collect</h2>
      <ul class="ml-6 list-disc space-y-2">
        <li>
          <strong>Account data:</strong> your name, email address, and avatar image, provided by
          GitHub when you sign in with OAuth, or the email you enter to request a magic sign-in
          link.
        </li>
        <li>
          <strong>Authentication &amp; session data:</strong> session tokens, IP address, and
          browser user agent, stored so we can keep you signed in and detect suspicious activity.
        </li>
        <li>
          <strong>Passkeys:</strong> if you register a passkey, we store the public key credential
          only. Your private key and any biometric data never leave your device.
        </li>
        <li>
          <strong>GitHub repository access:</strong> when you install the LightCMS GitHub App, we
          store the installation ID and the connected account or organization login so we know
          which repositories you've granted access to. Your content is read from and written back
          to your own repository — we do not copy it into our database.
        </li>
        <li>
          <strong>Usage analytics:</strong> in production, Vercel Analytics and Speed Insights
          collect anonymized page-view and performance metrics. This is disabled in local
          development.
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-lg font-semibold">2. How We Use This Information</h2>
      <p>We use the data above to:</p>
      <ul class="ml-6 list-disc space-y-2">
        <li>Authenticate you and maintain your signed-in session securely</li>
        <li>Access and manage, on your behalf, only the repositories you've explicitly granted</li>
        <li>Send transactional email, such as your magic sign-in link — never marketing email</li>
        <li>Monitor and improve site reliability and performance</li>
      </ul>
      <p>We do not sell your data, run advertising, or share it with third parties for marketing.</p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">3. Third-Party Services</h2>
      <ul class="ml-6 list-disc space-y-2">
        <li><strong>GitHub:</strong> OAuth sign-in and GitHub App repository access, governed by GitHub's own privacy policy.</li>
        <li><strong>Vercel:</strong> hosting, analytics, and speed insights.</li>
        <li><strong>Email provider:</strong> delivery of magic-link sign-in emails only.</li>
      </ul>
    </section>

    <section>
      <h2 class="text-lg font-semibold">4. Data Storage &amp; Retention</h2>
      <p>
        Account, session, and installation records are stored in a Postgres database. Deleting
        your account or revoking the GitHub App installation removes the associated records.
        Session tokens expire automatically after a limited period.
      </p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">5. Security</h2>
      <p>
        Sessions use secure, httpOnly cookies. Passkeys rely on WebAuthn public-key cryptography,
        and GitHub OAuth tokens are stored server-side only — they are never exposed to your
        browser. No method of electronic storage or transmission is completely secure, so we
        cannot guarantee absolute security.
      </p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">6. Your Choices</h2>
      <ul class="ml-6 list-disc space-y-2">
        <li>Revoke GitHub OAuth or GitHub App access at any time from your GitHub account settings.</li>
        <li>Remove a registered passkey or request account deletion by contacting us below.</li>
        <li>We do not use third-party advertising cookies or trackers.</li>
      </ul>
    </section>

    <section>
      <h2 class="text-lg font-semibold">7. Children's Privacy</h2>
      <p>
        LightCMS is not directed at children under 13, and we do not knowingly collect
        information from them.
      </p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">8. Changes to This Policy</h2>
      <p>
        We may update this policy as LightCMS evolves. Material changes will update the
        "Last updated" date above. Continued use of the Site after a change means you accept the
        revised policy.
      </p>
    </section>

    <section>
      <h2 class="text-lg font-semibold">9. Contact Us</h2>
      <p>If you have questions about this policy or your data, reach out through any of these:</p>
      <ul class="ml-6 list-disc space-y-2">
        <li>
          GitHub:
          <a
            href={SITE.repository}
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:text-primary/80"
          >
            {SITE.repository.replace("https://", "")}
          </a>
        </li>
        <li>
          Contact form:
          <a
            href={SITE.contactFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:text-primary/80"
          >
            Send a message
          </a>
        </li>
        <li>
          Email:
          <a href={`mailto:${SITE.contactEmail}`} class="text-primary underline hover:text-primary/80">
            {SITE.contactEmail}
          </a>
        </li>
      </ul>
    </section>

    <footer class="border-t border-border pt-6">
      <a
        href="/about"
        class="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to About
      </a>
    </footer>
  </article>
</section>
