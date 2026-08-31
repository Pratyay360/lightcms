---
title: "How to selfhost"
serial: 2
tags:
  - selfhost
  - lightcms
---

## selfhost

to make the bot yourself.. use the [mise]($mise.toml)

it;s purely sveltekit so you can selfhost it on any serverless
platform like netlify, vercel, cf pages or deno deploy etc,
also you can read about how to deploy a [vite app](https://nitro.build/deploy)
also you can selfhost with nodejs too .. please read about that in [nitro docs](https://nitro.build/deploy/runtimes/node)

## First required variables

```env
BETTER_AUTH_SECRET="" # generate this with `openssl rand -hex 32`
BETTER_AUTH_URL='https://lightcms.pratyay.qzz.io'
CDN_API_KEY='5386e05a3562c7a8f984e73401540836' # this is publically available for all https://imgcdn.dev/page/api
DATABASE_URL='postgresql://db:pass@example.com/db?sslmode=require&channel_binding=require'
GITHUB_APP_ID='appid'
GITHUB_APP_NAME='yet another bot'
GITHUB_CLIENT_ID='yet another bot's client id '
GITHUB_CLIENT_SECRET=''
GITHUB_PRIVATE_KEY='-----
BEGIN RSA PRIVATE KEY-----
xrdzeszsdsazdfytfytfyt-----
END RSA PRIVATE KEY-----'
##  if not working due to formatting related issues
GITHUB_WEBHOOK # generate from smee.io/
GITHUB_WEBHOOK_SECRET #generate using `openssl rand -hex 32`
#
MAIL_FROM='some_randommail@example.com'
MAIL_HOST='smtp.example.com'
MAIL_PASS=`email's passs`
MAIL_PORT=465 ## port is provided by your email provider
MAIL_SECURE=1 # 1/0  true(1) /false(0)
MAIL_USER='spooky user'
OPEN_AI_ENDPOINT =  #  https
OPEN_AI_APIKEY = # this is for copilot option so
OPEN_AI_MODEL = #
```

## If you have any domain using and setting up resend felt more easy [resend](https://resend.com) or if you don't have any domain don't be heavy hearted, there are multiple email providers which allows you sending mail programically [read about this](https://nodemailer.com/message/)

if you are finding one then, I can suggest you setting up with zohomail.

## setting up `BETTER_AUTH_SECRET`

```bash
openssl rand -hex 64
```

if openssl is not available on your system. you can use some online tools like

\[betterauth;s official site]\(<https://better-auth.com/docs/installation>)

also there is a python script for this too.

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

also some node js based script

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`BETTER_AUTH_URL` the endpoint of  your website
for dev env it should be "<http://localhost:5173>"

## setting up the bot ??

run

```bash
npm run bot:start
```

if everything is done correctly then you should be having a .env in your cwd.

setting up db.. there are multiple free postgre providers available you can refer to this repo [postgre](https://github.com/alexeyfv/awesome-free-postgres)

make sure you trust the db provider. that's it
suggested services:

[neon](https://neon.com)
[nile](https://thenile.dev)
[supabase](https://supabase.com)

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
