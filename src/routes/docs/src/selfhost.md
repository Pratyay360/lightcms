---
title: "How to selfhost"
serial: 2
tags:
  - selfhost
  - lightcms
---

## selfhost

to make the bot yourself.. use the

it;s purely sveltekit so you can selfhost it on any serverless
platform like netlify, vercel, cf pages or deno deploy etc,
also you can read about how to deploy a [vite app](https://nitro.build/deploy)
also you can selfhost with nodejs too .. please read about that in [nitro docs](https://nitro.build/deploy/runtimes/node)

## First required variables

```env
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="https://your-domain.example"
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Image CDN configuration
CDN_API_KEY="your-cdn-api-key"

# GitHub App configuration
GITHUB_APP_ID="your-app-id"
GITHUB_APP_NAME="your-app-name"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK="https://your-webhook-endpoint.example"
GITHUB_WEBHOOK_SECRET=""

# SMTP configuration
MAIL_FROM="newsletter@example.com"
MAIL_HOST="smtp.example.com"
MAIL_PASS="your-smtp-password"
MAIL_PORT="465"
MAIL_SECURE="1"
MAIL_USER="smtp-user"

# Optional AI configuration
OPEN_AI_ENDPOINT="https://api.openai.com/v1"
OPEN_AI_APIKEY="your-api-key"
OPEN_AI_MODEL="your-model"
```

`BETTER_AUTH_URL` must match the public URL where the application is served. For local development, use `http://localhost:5173`.

Generate secrets locally instead of copying values from a website:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

also some node js based script

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For more information about authentication configuration, see the [Better Auth installation guide](https://better-auth.com/docs/installation).

## 3. Set up the database

LightCMS uses PostgreSQL. You can use a managed provider such as [Neon](https://neon.com), [Nile](https://thenile.dev), or [Supabase](https://supabase.com), or run PostgreSQL yourself. Make sure the provider supports encrypted connections and that the connection string is stored only in your environment variables.

After setting `DATABASE_URL`, generate and apply the repository migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Use `drizzle-kit push` only for a development database when you intentionally want to synchronize the schema directly. Prefer generated migrations for shared or production databases.

```bash
npx drizzle-kit push
```

If the database schema is out of sync with the repository, inspect the database before changing it. Do not run destructive commands against production without a backup and a review of the generated SQL.

## 4. Configure GitHub

Create a GitHub App for the repository and copy its App ID, client credentials, webhook secret, and private key into the environment. Grant only the repository permissions required by your workflow, then subscribe the app to the events that LightCMS handles.

The private key must preserve its line breaks. If your deployment platform requires a single-line value, encode the newlines using the format supported by that platform and decode them in the application configuration. The [SAMLTool private-key formatter](https://www.samltool.com/format_privatekey.php) can help inspect formatting, but never paste a production key into a third-party service.

For local webhook testing, use a tunnel such as [smee.io](https://smee.io/) and set `GITHUB_WEBHOOK` to the resulting endpoint. Use the permanent HTTPS URL from your deployment in production.

## 5. Configure email

LightCMS sends email through SMTP. Set the `MAIL_*` variables using credentials from your email provider. [Nodemailer](https://nodemailer.com/message/) documents the available SMTP options.

You can also use a provider such as [Resend](https://resend.com) if it supports the SMTP or API workflow configured for your installation. Verify the sender domain and configure SPF, DKIM, and DMARC before sending production email.

## 6. Run and deploy

Start the GitHub bot locally with:

```bash
npm run bot:start
```

if everything is done correctly then you should be having a .env in your cwd.

setting up db.. there are multiple free postgre providers available you can refer to this repo [postgre](https://github.com/alexeyfv/awesome-free-postgres)

make sure you trust the db provider. that's it
suggested services:

[neon](https://neon.com) [nile](https://thenile.dev) [supabase](https://supabase.com)

```bash
npx  drizzle-kit generate

npx  drizzle-kit migrate

npx  drizzle-kit push
```

If encountered any error while doing this run

```sh

npx  drizzle-kit introspect

```

## To format the Rsa private key properly you can use

`GITHUB_PRIVATE_KEY`

[use this site](https://www.samltool.com/format_privatekey.php)
