# Login and Email Setup

This project uses two email paths:

- Supabase Auth sends login magic links.
- Resend sends product emails such as "we received your question" and owner notifications.

## Vercel Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=re_your_resend_key
RESEND_FROM=Life Compass <hello@yourdomain.com>
OWNER_NOTIFY_EMAIL=your-inbox@example.com
PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Redeploy after adding or changing environment variables.

## Supabase Auth

In Supabase:

1. Go to Authentication > Providers.
2. Enable Email provider.
3. Enable magic link / OTP sign-in.
4. Go to Authentication > URL Configuration.
5. Set Site URL to your Vercel production URL.
6. Add Redirect URLs:

```text
https://your-vercel-domain.vercel.app/dashboard.html
https://your-vercel-domain.vercel.app/login.html
```

For local testing, also add:

```text
http://localhost:4173/dashboard.html
http://localhost:4173/login.html
```

## User Flow

1. User submits the intake form on the home page.
2. `/api/lead` stores the profile, sends a Supabase invite, and sends a Resend confirmation email.
3. User can also open `/login.html` and request a magic link.
4. Supabase sends the magic link.
5. The link redirects to `/dashboard.html`.
6. `dashboard.js` stores the session token from the URL hash and calls `/api/me`.

## Current Pages

- `index.html`: public landing and intake form.
- `login.html`: magic link login form.
- `dashboard.html`: private-ish session page after magic link.

This is a lightweight login flow for beta intake. For a real member area, store session refresh securely and add row-level policies around user-owned records.
