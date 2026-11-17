# Nexivious

A JavaScript and Next.js company portfolio with a SQLite-backed contact inbox and a password-protected content editor.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
```

Set `ADMIN_USERNAME`, a private `ADMIN_PASSWORD` of at least 12 characters, and an `ADMIN_SESSION_SECRET` of at least 32 characters in `.env.local`. Generate a random session secret in PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Keep `.env.local` private and never commit it. Then start the app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public website or [http://localhost:3000/admin](http://localhost:3000/admin) to sign in and edit the homepage or review inquiries.

The SQLite database is created automatically at `.data/nexivious.sqlite`. Set `DATABASE_PATH` if you want to store it elsewhere. Back up this file to preserve saved content and inquiries.

## Deploy to Vercel

Vercel serverless functions do not provide persistent local SQLite storage. Create a Turso database and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as private Vercel environment variables for Production (and Preview if needed). Also set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (at least 12 characters), and a random `ADMIN_SESSION_SECRET` (at least 32 characters). Never commit or share these secrets.

After connecting the Git repository to Vercel, deploy with the Vercel Git integration or `npx vercel --prod`. The app creates its content and inquiry tables on first use; the homepage starts with the built-in default content.
